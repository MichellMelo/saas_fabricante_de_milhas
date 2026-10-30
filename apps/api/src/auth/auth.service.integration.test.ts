import { BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuthService } from "./auth.service";

const prisma = new PrismaClient();
const service = new AuthService(
  prisma as never,
  new JwtService({ secret: "integration-test-only-secret" }),
);

let userId: string | undefined;
let tokenHash: string | undefined;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be provided by the guarded integration-test runner.");
  }
  await prisma.$connect();
});

afterAll(async () => {
  if (userId) {
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

describe("AuthService password reset with PostgreSQL", () => {
  it("allows only one concurrent reset to claim and consume the same token", async () => {
    const suffix = randomBytes(8).toString("hex");
    const rawToken = randomBytes(32).toString("hex");
    tokenHash = createHash("sha256").update(rawToken).digest("hex");

    const user = await prisma.user.create({
      data: {
        email: `integration-reset-${suffix}@example.invalid`,
        active: true,
        passwordHash: await hash("Original-password-123", 4),
      },
      select: { id: true, authVersion: true },
    });
    userId = user.id;

    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
      select: { id: true },
    });

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
        where: { id: resetToken.id },
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
});
