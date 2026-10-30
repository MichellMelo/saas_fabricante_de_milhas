import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ProductType, Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
 private readonly logger = new Logger(AuthService.name);
 constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

 async register(): Promise<never> {
  throw new ForbiddenException("O cadastro é feito somente por convite. Solicite acesso à equipe Fabricante de Milhas.");
 }

 async acceptInvitation(dto: AcceptInvitationDto) {
  const tokenHash = createHash("sha256").update(dto.token).digest("hex");
  const emailName = dto.name.trim();
  const passwordHash = await hash(dto.password, 12);
  const now = new Date();

  const user = await this.prisma.$transaction(async (tx) => {
   const invitation = await tx.clientInvitation.findUnique({ where: { tokenHash } });
   if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) {
    throw new BadRequestException("Convite inválido, expirado ou já utilizado.");
   }

   const email = invitation.email.trim().toLowerCase();
   const existing = await tx.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
   if (existing?.passwordHash) throw new ConflictException("Já existe uma conta com esse e-mail. Faça login ou solicite suporte.");

   const claimed = await tx.clientInvitation.updateMany({
    where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
    data: { acceptedAt: now },
   });
   if (claimed.count !== 1) throw new BadRequestException("Este convite já foi utilizado ou expirou.");

   const created = existing
    ? await tx.user.update({
       where: { id: existing.id },
       data: { passwordHash, name: emailName || invitation.name || undefined },
       select: { id: true, email: true, name: true, createdAt: true, authVersion: true },
      })
    : await tx.user.create({
       data: { email, passwordHash, name: emailName || invitation.name },
       select: { id: true, email: true, name: true, createdAt: true, authVersion: true },
      });

   await tx.userProductAccess.createMany({
    data: invitation.productTypes.map((product: ProductType) => ({
     userId: created.id,
     product,
     active: true,
     startsAt: now,
    })),
    skipDuplicates: true,
   });
   return created;
  });

  return { user, accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, authVersion: user.authVersion }) };
 }


 async bootstrapFirstAdmin(dto: { email: string; name?: string; password: string }, suppliedToken?: string) {
  const configuredToken = process.env.ADMIN_BOOTSTRAP_TOKEN ?? "";
  const configuredEmail = (process.env.ADMIN_BOOTSTRAP_EMAIL ?? "").trim().toLowerCase();
  const provided = Buffer.from(suppliedToken ?? "");
  const expected = Buffer.from(configuredToken);
  if (configuredToken.length < 32 || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
   throw new ForbiddenException("Bootstrap administrativo não autorizado.");
  }
  const email = dto.email.trim().toLowerCase();
  if (!configuredEmail || email !== configuredEmail) {
   throw new ForbiddenException("O e-mail não corresponde ao autorizado para o bootstrap.");
  }
  const passwordHash = await hash(dto.password, 12);
  const now = new Date();
  const user = await this.prisma.$transaction(async (tx) => {
   const existingAdmins = await tx.user.count({
    where: { active: true, passwordHash: { not: null }, OR: [{ isAdmin: true }, { email: { in: (process.env.ADMIN_EMAILS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) } }] },
   });
   if (existingAdmins > 0) throw new ConflictException("O bootstrap já foi encerrado: existe um administrador ativo.");
   const existing = await tx.user.findUnique({ where: { email } });
   if (existing?.passwordHash) throw new ConflictException("Já existe uma conta com esse e-mail. O bootstrap não pode substituir credenciais.");
   const created = existing
    ? await tx.user.update({ where: { id: existing.id }, data: { name: dto.name?.trim() || existing.name, passwordHash, active: true, isAdmin: true, authVersion: { increment: 1 }, lastLoginAt: now } })
    : await tx.user.create({ data: { email, name: dto.name?.trim() || null, passwordHash, active: true, isAdmin: true, lastLoginAt: now } });
   await tx.adminAuditLog.create({
    data: { targetUserId: created.id, targetEmail: created.email, action: "FIRST_ADMIN_BOOTSTRAPPED", details: { method: "one_time_environment_token" } },
   });
   return created;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return {
   user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, isAdmin: true },
   accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, authVersion: user.authVersion }),
  };
 }

 async login(dto: LoginDto) {
  const email = dto.email.trim().toLowerCase();
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !(await compare(dto.password, user.passwordHash))) {
   throw new UnauthorizedException("E-mail ou senha inválidos.");
  }
  if (!user.active) {
   throw new UnauthorizedException("Sua conta está inativa. Entre em contato com o administrador para solicitar a reativação.");
  }
  await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return {
   user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
   accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email, authVersion: user.authVersion })
  };
 }


 async requestPasswordReset(rawEmail: string) {
  const generic = {
   success: true,
   message: "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha. Verifique sua caixa de entrada e spam.",
  };
  const email = rawEmail.trim().toLowerCase();
  const user = await this.prisma.user.findUnique({
   where: { email },
   select: { id: true, email: true, active: true, passwordHash: true, name: true },
  });
  if (!user?.active || !user.passwordHash) return generic;

  const now = new Date();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const configuredBase = process.env.FRONTEND_BASE_URL ?? (process.env.NODE_ENV === "production" ? "" : process.env.WEB_BASE_URL ?? "http://localhost:3000");
  if (!apiKey || !from || !configuredBase) {
   this.logger.warn("Recuperação de senha indisponível: serviço de e-mail ou URL pública não configurados.");
   return generic;
  }

  let baseUrl: URL;
  try {
   baseUrl = new URL(configuredBase);
   if (!["https:", "http:"].includes(baseUrl.protocol)) return generic;
  } catch {
   this.logger.error("FRONTEND_BASE_URL inválida para recuperação de senha.");
   return generic;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(now.getTime() + 30 * 60_000);
  // Serialize reset requests per account. Counting and inserting while holding
  // the user's row lock prevents concurrent requests from exceeding the limit.
  const resetToken = await this.prisma.$transaction(async (tx) => {
   await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
   const recentRequests = await tx.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(now.getTime() - 15 * 60_000) } },
   });
   if (recentRequests >= 3) return null;
   return tx.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
    select: { id: true },
   });
  });
  if (!resetToken) return generic;

  const resetUrl = new URL("/reset-password", baseUrl);
  resetUrl.searchParams.set("token", token);

  try {
   const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
     from,
     to: [user.email],
     subject: "Redefinição de senha — Fabricante de Milhas",
     html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>Redefina sua senha</h2><p>Recebemos uma solicitação para redefinir a senha da sua conta no Fabricante de Milhas.</p><p><a href="${resetUrl.toString()}" style="display:inline-block;padding:12px 18px;background:#101a2b;color:#fff;text-decoration:none;border-radius:8px">Criar nova senha</a></p><p>O link expira em 30 minutos e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore esta mensagem.</p></div>`,
    }),
   });
   if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend HTTP ${response.status}: ${detail.slice(0, 300)}`);
   }
   await this.prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
     where: { userId: user.id, id: { not: resetToken.id }, usedAt: null },
     data: { usedAt: now },
    });
    await tx.adminAuditLog.create({
     data: { targetUserId: user.id, targetEmail: user.email, action: "PASSWORD_RESET_REQUESTED", details: { expiresInMinutes: 30 } },
    });
   });
  } catch (error) {
   await this.prisma.passwordResetToken.updateMany({ where: { id: resetToken.id, usedAt: null }, data: { usedAt: now } });
   this.logger.warn(`Falha no envio de recuperação de senha (token ${resetToken.id}): ${error instanceof Error ? error.message : "erro desconhecido"}`);
  }
  return generic;
 }

 async resetPassword(dto: { token?: string; password?: string }) {
  const token = typeof dto.token === "string" ? dto.token : "";
  const password = typeof dto.password === "string" ? dto.password : "";
  if (!token) throw new BadRequestException("O link de redefinição está incompleto.");
  if (password.length < 8 || password.length > 128) throw new BadRequestException("A nova senha deve ter entre 8 e 128 caracteres.");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const passwordReset = await this.prisma.passwordResetToken.findUnique({
   where: { tokenHash },
   include: { user: { select: { id: true, email: true, active: true } } },
  });
  if (!passwordReset || passwordReset.usedAt || passwordReset.expiresAt <= now || !passwordReset.user.active) {
   throw new BadRequestException("Link inválido, expirado ou já utilizado. Solicite uma nova redefinição.");
  }
  const passwordHash = await hash(password, 12);
  await this.prisma.$transaction(async (tx) => {
   const claimed = await tx.passwordResetToken.updateMany({
    where: { id: passwordReset.id, usedAt: null, expiresAt: { gt: now } },
    data: { usedAt: now },
   });
   if (claimed.count !== 1) throw new BadRequestException("Este link já foi utilizado ou expirou. Solicite uma nova redefinição.");
   const changed = await tx.user.updateMany({
    where: { id: passwordReset.user.id, active: true },
    data: { passwordHash, authVersion: { increment: 1 } },
   });
   if (changed.count !== 1) throw new BadRequestException("Não foi possível redefinir a senha desta conta.");
   await tx.passwordResetToken.updateMany({
    where: { userId: passwordReset.user.id, id: { not: passwordReset.id }, usedAt: null },
    data: { usedAt: now },
   });
   await tx.adminAuditLog.create({
    data: { targetUserId: passwordReset.user.id, targetEmail: passwordReset.user.email, action: "PASSWORD_RESET_COMPLETED" },
   });
  });
  return { success: true, message: "Senha redefinida. Entre novamente com sua nova senha." };
 }

 async updateProfile(userId: string, dto: UpdateProfileDto) {
  const name = dto.name.trim();
  if (!name) throw new BadRequestException("Informe seu nome.");
  return this.prisma.user.update({
   where: { id: userId },
   data: { name },
   select: { id: true, email: true, name: true, createdAt: true },
  });
 }

 async changePassword(userId: string, dto: ChangePasswordDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
  if (!user?.passwordHash || !(await compare(dto.currentPassword, user.passwordHash))) {
   throw new UnauthorizedException("A senha atual está incorreta.");
  }
  if (dto.newPassword.length < 8) throw new BadRequestException("A nova senha deve ter pelo menos 8 caracteres.");
  const passwordHash = await hash(dto.newPassword, 12);
  await this.prisma.user.update({ where: { id: userId }, data: { passwordHash, authVersion: { increment: 1 } } });
  return { success: true };
 }

 async getPublicUser(userId: string) {
  const user = await this.prisma.user.findUnique({
   where: { id: userId },
   select: {
    id: true, email: true, name: true, active: true, isAdmin: true, createdAt: true,
    productAccesses: { select: { product: true, active: true, startsAt: true, expiresAt: true } },
   }
  });
  if (!user || !user.active) throw new UnauthorizedException("Conta inativa ou sessão inválida. Entre em contato com o administrador.");
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const now = new Date();
  return {
   ...user,
   isAdmin: user.isAdmin || admins.includes(user.email.trim().toLowerCase()),
   productAccesses: user.productAccesses.filter((access) =>
    access.active && access.startsAt <= now && (!access.expiresAt || access.expiresAt > now)
   ),
  };
 }
}
