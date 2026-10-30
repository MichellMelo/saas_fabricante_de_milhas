import "reflect-metadata";
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
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "unavailable" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(service.requestPasswordReset("user@example.com")).resolves.toEqual(genericResponse);
    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { id: "reset-2", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });
});
