import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

const prisma = new PrismaClient();
const service = new AuthService(
  prisma as never,
  new JwtService({ secret: "integration-test-only-secret" }),
);
const createdUserIds: string[] = [];

async function createFixture(options: {
  active?: boolean;
  expiresAt?: Date;
  usedAt?: Date | null;
} = {}) {
  const suffix = randomBytes(8).toString("hex");
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const originalPasswordHash = await hash("Original-password-123", 4);

  const user = await prisma.user.create({
    data: {
      email: `integration-reset-${suffix}@example.invalid`,
      active: options.active ?? true,
      passwordHash: originalPasswordHash,
    },
    select: { id: true, authVersion: true },
  });
  createdUserIds.push(user.id);

  const token = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: options.expiresAt ?? new Date(Date.now() + 5 * 60_000),
      ...(options.usedAt !== undefined ? { usedAt: options.usedAt } : {}),
    },
    select: { id: true },
  });

  return { user, token, rawToken, originalPasswordHash };
}

async function expectNoPasswordResetSideEffects(
  userId: string,
  tokenId: string,
  originalPasswordHash: string,
  expectedAuthVersion: number,
  expectedUsedAt: Date | null,
) {
  const [user, token, auditEvents] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { passwordHash: true, authVersion: true },
    }),
    prisma.passwordResetToken.findUniqueOrThrow({
      where: { id: tokenId },
      select: { usedAt: true },
    }),
    prisma.adminAuditLog.count({
      where: { targetUserId: userId, action: "PASSWORD_RESET_COMPLETED" },
    }),
  ]);

  expect(user.passwordHash).toBe(originalPasswordHash);
  expect(user.authVersion).toBe(expectedAuthVersion);
  expect(token.usedAt?.getTime() ?? null).toBe(expectedUsedAt?.getTime() ?? null);
  expect(auditEvents).toBe(0);
}

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be provided by the guarded integration-test runner.");
  }
  await prisma.$connect();
});

afterAll(async () => {
  // Defensive cleanup in case a test is interrupted while exercising the failure trigger.
  await prisma.$executeRawUnsafe(
    'DROP TRIGGER IF EXISTS integration_fail_password_hash_update ON "User"',
  );
  await prisma.$executeRawUnsafe(
    "DROP FUNCTION IF EXISTS integration_fail_password_hash_update()",
  );
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("AuthService password reset with PostgreSQL", () => {
  it("enforces the three-request rate limit under concurrent requests for the same account", async () => {
    const suffix = randomBytes(8).toString("hex");
    const user = await prisma.user.create({
      data: {
        email: `integration-rate-limit-${suffix}@example.invalid`,
        active: true,
        passwordHash: await hash("Original-password-123", 4),
      },
      select: { id: true, email: true },
    });
    createdUserIds.push(user.id);

    const previousEnv = {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
      base: process.env.FRONTEND_BASE_URL,
    };
    process.env.RESEND_API_KEY = "integration-test-resend-key";
    process.env.EMAIL_FROM = "test@example.invalid";
    process.env.FRONTEND_BASE_URL = "https://example.invalid";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const attempts = await Promise.all(
        Array.from({ length: 8 }, () => service.requestPasswordReset(user.email)),
      );

      expect(attempts).toHaveLength(8);
      expect(attempts.every((result) => result.success)).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(3);
      await expect(
        prisma.passwordResetToken.count({ where: { userId: user.id } }),
      ).resolves.toBe(3);
      await expect(
        prisma.adminAuditLog.count({
          where: { targetUserId: user.id, action: "PASSWORD_RESET_REQUESTED" },
        }),
      ).resolves.toBe(3);
    } finally {
      vi.unstubAllGlobals();
      if (previousEnv.apiKey === undefined) delete process.env.RESEND_API_KEY;
      else process.env.RESEND_API_KEY = previousEnv.apiKey;
      if (previousEnv.from === undefined) delete process.env.EMAIL_FROM;
      else process.env.EMAIL_FROM = previousEnv.from;
      if (previousEnv.base === undefined) delete process.env.FRONTEND_BASE_URL;
      else process.env.FRONTEND_BASE_URL = previousEnv.base;
    }
  });


  it("allows only one concurrent reset to claim and consume the same token", async () => {
    const { user, token, rawToken } = await createFixture();

    const attempts = await Promise.allSettled([
      service.resetPassword({ token: rawToken, password: "New-password-123" }),
      service.resetPassword({ token: rawToken, password: "Another-password-456" }),
    ]);

    const fulfilled = attempts.filter((result) => result.status === "fulfilled");
    const rejected = attempts.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);

    const [updatedUser, consumedToken, auditEvents] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: { passwordHash: true, authVersion: true },
      }),
      prisma.passwordResetToken.findUniqueOrThrow({
        where: { id: token.id },
        select: { usedAt: true },
      }),
      prisma.adminAuditLog.count({
        where: { targetUserId: user.id, action: "PASSWORD_RESET_COMPLETED" },
      }),
    ]);

    expect(updatedUser.passwordHash).not.toBeNull();
    expect(updatedUser.authVersion).toBe(user.authVersion + 1);
    expect(consumedToken.usedAt).toBeInstanceOf(Date);
    expect(auditEvents).toBe(1);
  });

  it("rejects an expired token without changing the password or creating an audit event", async () => {
    const { user, token, rawToken, originalPasswordHash } = await createFixture({
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      service.resetPassword({ token: rawToken, password: "New-password-123" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expectNoPasswordResetSideEffects(
      user.id,
      token.id,
      originalPasswordHash,
      user.authVersion,
      null,
    );
  });

  it("rejects an already-used token without changing the password or audit history", async () => {
    const usedAt = new Date(Date.now() - 30_000);
    const { user, token, rawToken, originalPasswordHash } = await createFixture({ usedAt });

    await expect(
      service.resetPassword({ token: rawToken, password: "New-password-123" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expectNoPasswordResetSideEffects(
      user.id,
      token.id,
      originalPasswordHash,
      user.authVersion,
      usedAt,
    );
  });

  it("rejects password reset for an inactive user without changing persisted state", async () => {
    const { user, token, rawToken, originalPasswordHash } = await createFixture({
      active: false,
    });

    await expect(
      service.resetPassword({ token: rawToken, password: "New-password-123" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expectNoPasswordResetSideEffects(
      user.id,
      token.id,
      originalPasswordHash,
      user.authVersion,
      null,
    );
  });

  it("does not mutate persisted state when the submitted password is invalid", async () => {
    const { user, token, rawToken, originalPasswordHash } = await createFixture();

    await expect(
      service.resetPassword({ token: rawToken, password: "short" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expectNoPasswordResetSideEffects(
      user.id,
      token.id,
      originalPasswordHash,
      user.authVersion,
      null,
    );
  });

  it("rolls back token consumption and audit when the password update fails in PostgreSQL", async () => {
    const { user, token, rawToken, originalPasswordHash } = await createFixture();

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION integration_fail_password_hash_update()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'integration test: forced password update failure';
      END;
      $$ LANGUAGE plpgsql
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER integration_fail_password_hash_update
      BEFORE UPDATE OF "passwordHash" ON "User"
      FOR EACH ROW
      EXECUTE FUNCTION integration_fail_password_hash_update()
    `);

    try {
      await expect(
        service.resetPassword({ token: rawToken, password: "New-password-123" }),
      ).rejects.toThrow();
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER IF EXISTS integration_fail_password_hash_update ON "User"',
      );
      await prisma.$executeRawUnsafe(
        "DROP FUNCTION IF EXISTS integration_fail_password_hash_update()",
      );
    }

    await expectNoPasswordResetSideEffects(
      user.id,
      token.id,
      originalPasswordHash,
      user.authVersion,
      null,
    );
  });
});
