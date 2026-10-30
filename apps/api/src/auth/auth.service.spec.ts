import "reflect-metadata";
import { createHash } from "node:crypto";
import { BadRequestException } from "@nestjs/common";
import { compare } from "bcryptjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

const genericResponse = {
  success: true,
  message: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha. Verifique sua caixa de entrada e spam.",
};

describe("AuthService password recovery", () => {
  let prisma: any;
  let jwt: any;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn(), updateMany: vi.fn() },
      passwordResetToken: {
        count: vi.fn(),
        create: vi.fn(),
        updateMany: vi.fn(),
        findUnique: vi.fn(),
      },
      adminAuditLog: { create: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(prisma)),
    };
    jwt = { signAsync: vi.fn() };
    service = new AuthService(prisma, jwt);
    process.env.RESEND_API_KEY = "test-resend-key";
    process.env.EMAIL_FROM = "test@example.com";
    process.env.FRONTEND_BASE_URL = "https://example.test";
    prisma.passwordResetToken.count.mockResolvedValue(0);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.FRONTEND_BASE_URL;
  });

  it("returns the same generic response when the email does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.requestPasswordReset("unknown@example.com")).resolves.toEqual(genericResponse);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("does not create a token for an inactive account", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1", email: "inactive@example.com", active: false, passwordHash: "hash", name: "Inactive",
    });

    await expect(service.requestPasswordReset("inactive@example.com")).resolves.toEqual(genericResponse);
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("does not send another email after the account rate limit is reached", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1", email: "user@example.com", active: true, passwordHash: "hash", name: "User",
    });
    prisma.passwordResetToken.count.mockResolvedValue(3);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(service.requestPasswordReset(" USER@example.com ")).resolves.toEqual(genericResponse);
    expect(prisma.passwordResetToken.count).toHaveBeenCalled();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores only a token hash and invalidates previous unused tokens after email delivery", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1", email: "user@example.com", active: true, passwordHash: "hash", name: "User",
    });
    prisma.passwordResetToken.create.mockImplementation(async ({ data }: any) => {
      expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(data.tokenHash).not.toContain("token=");
      return { id: "reset-1" };
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(service.requestPasswordReset("user@example.com")).resolves.toEqual(genericResponse);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", id: { not: "reset-1" }, usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalled();
  });

  it("marks the newly created token as used when the email provider fails", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1", email: "user@example.com", active: true, passwordHash: "hash", name: "User",
    });
    prisma.passwordResetToken.create.mockResolvedValue({ id: "reset-2" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "unavailable" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(service.requestPasswordReset("user@example.com")).resolves.toEqual(genericResponse);
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { id: "reset-2", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });
});

describe("AuthService resetPassword", () => {
  let prisma: any;
  let service: AuthService;
  const rawToken = "unit-test-reset-token";
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const validReset = (overrides: Record<string, unknown> = {}) => ({
    id: "reset-1",
    tokenHash,
    usedAt: null,
    expiresAt: new Date(Date.now() + 30 * 60_000),
    user: { id: "user-1", email: "user@example.com", active: true },
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      user: { findUnique: vi.fn(), updateMany: vi.fn() },
      passwordResetToken: {
        findUnique: vi.fn(),
        updateMany: vi.fn(),
      },
      adminAuditLog: { create: vi.fn() },
      $transaction: vi.fn(async (callback: (tx: any) => unknown) => callback(prisma)),
    };
    service = new AuthService(prisma, {} as any);
  });

  it("rejects a missing token without querying the database", async () => {
    await expect(service.resetPassword({ password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a token that does not exist", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset({
      expiresAt: new Date(Date.now() - 1_000),
    }));

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a token that has already been used", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset({ usedAt: new Date() }));

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a reset for an inactive account", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset({
      user: { id: "user-1", email: "user@example.com", active: false },
    }));

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ["short", "1234567"],
    ["too long", "a".repeat(129)],
  ])("rejects a %s password before querying the token", async (_label, password) => {
    await expect(service.resetPassword({ token: rawToken, password }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("updates the password, increments authVersion, invalidates other tokens, and audits success", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset());
    prisma.passwordResetToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .resolves.toEqual({
        success: true,
        message: "Senha redefinida. Entre novamente com sua nova senha.",
      });

    const userUpdate = prisma.user.updateMany.mock.calls[0][0];
    expect(userUpdate.where).toEqual({ id: "user-1", active: true });
    expect(userUpdate.data.authVersion).toEqual({ increment: 1 });
    expect(userUpdate.data.passwordHash).not.toBe("NewPassword123");
    await expect(compare("NewPassword123", userUpdate.data.passwordHash)).resolves.toBe(true);

    expect(prisma.passwordResetToken.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: "reset-1", usedAt: null, expiresAt: { gt: expect.any(Date) } },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.passwordResetToken.updateMany).toHaveBeenNthCalledWith(2, {
      where: { userId: "user-1", id: { not: "reset-1" }, usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: {
        targetUserId: "user-1",
        targetEmail: "user@example.com",
        action: "PASSWORD_RESET_COMPLETED",
      },
    });
  });

  it("does not update the password when another request has already claimed the token", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset());
    prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });

  it("rejects when the account cannot be updated and does not write the audit event", async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue(validReset());
    prisma.passwordResetToken.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.resetPassword({ token: rawToken, password: "NewPassword123" }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
});
