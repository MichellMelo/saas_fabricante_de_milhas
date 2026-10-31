import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptAdminInvitationDto } from "./dto/accept-admin-invitation.dto";
import { CreateAdminInvitationDto } from "./dto/create-admin-invitation.dto";

const ADMIN_INVITATION_TTL_DAYS = 7;
const MAX_EMAIL_ATTEMPTS = 3;

@Injectable()
export class AdminManagementService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdminManagementService.name);
  private retryTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  onModuleInit() {
    this.retryTimer = setInterval(() => void this.retryPendingEmails(), 60_000);
  }

  onModuleDestroy() {
    if (this.retryTimer) clearInterval(this.retryTimer);
  }

  private frontendBaseUrl() {
    const configured = process.env.FRONTEND_BASE_URL ?? (process.env.NODE_ENV === "production" ? undefined : process.env.WEB_BASE_URL);
    if (!configured && process.env.NODE_ENV === "production") {
      throw new InternalServerErrorException("FRONTEND_BASE_URL precisa apontar para a URL pública do frontend.");
    }
    const value = (configured ?? "http://localhost:3000").trim();
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new InternalServerErrorException("FRONTEND_BASE_URL deve ser uma URL absoluta válida do frontend.");
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new InternalServerErrorException("FRONTEND_BASE_URL deve usar HTTP ou HTTPS.");
    }
    return url.toString().replace(/\/$/, "");
  }

  private envAdminEmails() {
    return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  }

  async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, active: true, isAdmin: true } });
    if (!user?.active || !(user.isAdmin || this.envAdminEmails().includes(user.email.trim().toLowerCase()))) {
      throw new ForbiddenException("Apenas administradores podem gerenciar administradores.");
    }
    return user;
  }

  private async writeAudit(actorUserId: string | null, targetUserId: string | null, targetEmail: string, action: string, details?: Prisma.InputJsonValue) {
    await this.prisma.adminAuditLog.create({
      data: { actorUserId, targetUserId, targetEmail, action, ...(details ? { details } : {}) },
    });
  }

  async list() {
    const envAdmins = this.envAdminEmails();
    const users = await this.prisma.user.findMany({
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      select: { id: true, email: true, name: true, active: true, isAdmin: true, passwordHash: true, createdAt: true, lastLoginAt: true, authVersion: true },
    });
    const administrators = users.filter((user) => user.isAdmin || envAdmins.includes(user.email.trim().toLowerCase())).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      isAdmin: true,
      hasAccount: Boolean(user.passwordHash),
      source: envAdmins.includes(user.email.trim().toLowerCase()) ? "environment" : "database",
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));
    const clients = users.filter((user) => !user.isAdmin && !envAdmins.includes(user.email.trim().toLowerCase())).map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      hasAccount: Boolean(user.passwordHash),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }));
    const invitations = await this.prisma.adminInvitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, expiresAt: true, emailStatus: true, emailAttempts: true, lastEmailError: true, createdAt: true },
    });
    return { administrators, clients, invitations };
  }

  async createInvitation(actorUserId: string, dto: CreateAdminInvitationDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true, isAdmin: true } });
    if (existing?.isAdmin || this.envAdminEmails().includes(email)) {
      throw new ConflictException("Este e-mail já possui acesso administrativo.");
    }
    if (existing?.passwordHash) {
      throw new ConflictException("Este e-mail já possui uma conta. Promova o cliente existente pela lista de clientes.");
    }
    const activeInvite = await this.prisma.adminInvitation.findFirst({
      where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
    if (activeInvite) throw new ConflictException("Já existe um convite administrativo pendente para este e-mail.");

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + ADMIN_INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const invitation = await this.prisma.adminInvitation.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        tokenHash,
        invitedByUserId: actorUserId,
        expiresAt,
        emailStatus: "PENDING",
        nextEmailAttemptAt: new Date(),
      },
      select: { id: true, email: true, name: true, expiresAt: true, createdAt: true },
    });
    await this.writeAudit(actorUserId, existing?.id ?? null, email, "ADMIN_INVITATION_CREATED", { invitationId: invitation.id });
    await this.deliverInvitation(invitation.id, token);
    const updated = await this.prisma.adminInvitation.findUnique({
      where: { id: invitation.id },
      select: { id: true, emailStatus: true, emailAttempts: true, lastEmailError: true },
    });
    const baseUrl = this.frontendBaseUrl();
    return {
      invitation: { ...invitation, emailStatus: updated?.emailStatus, emailAttempts: updated?.emailAttempts },
      inviteUrl: updated?.emailStatus === "MANUAL" ? `${baseUrl}/accept-admin-invite?token=${token}` : undefined,
      delivery: updated?.emailStatus === "SENT" ? "sent" : updated?.emailStatus === "MANUAL" ? "manual" : updated?.emailStatus === "FAILED" ? "failed" : "queued",
      message: updated?.emailStatus === "SENT" ? "Convite enviado por e-mail." : updated?.emailStatus === "MANUAL" ? "Envio automático não configurado. Copie o link para enviar manualmente." : "Convite criado; o sistema tentará enviar o e-mail automaticamente.",
    };
  }

  private async deliverInvitation(id: string, initialToken?: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({ where: { id } });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt <= new Date()) return;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      await this.prisma.adminInvitation.update({ where: { id }, data: { emailStatus: "MANUAL", nextEmailAttemptAt: null } });
      return;
    }
    const claimed = await this.prisma.adminInvitation.updateMany({
      where: { id, acceptedAt: null, expiresAt: { gt: new Date() }, emailStatus: { in: ["PENDING", "RETRY"] }, emailAttempts: { lt: MAX_EMAIL_ATTEMPTS } },
      data: { emailStatus: "SENDING" },
    });
    if (!claimed.count) return;

    const token = initialToken ?? randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    if (!initialToken) {
      await this.prisma.adminInvitation.update({ where: { id }, data: { tokenHash } });
    }
    const baseUrl = this.frontendBaseUrl();
    const inviteUrl = `${baseUrl}/accept-admin-invite?token=${token}`;
    const attempt = invitation.emailAttempts + 1;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [invitation.email],
          subject: "Convite administrativo — Fabricante de Milhas",
          html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>Você foi convidado para administrar o Fabricante de Milhas</h2><p>Conclua seu cadastro para ativar o acesso administrativo completo.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 18px;background:#101a2b;color:#fff;text-decoration:none;border-radius:8px">Aceitar convite</a></p><p>Este link expira em sete dias e só pode ser utilizado uma vez.</p></div>`,
        }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Resend retornou HTTP ${response.status}: ${body.slice(0, 500)}`);
      }
      await this.prisma.adminInvitation.update({
        where: { id },
        data: { emailStatus: "SENT", emailAttempts: attempt, lastEmailError: null, nextEmailAttemptAt: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const retry = attempt < MAX_EMAIL_ATTEMPTS;
      const delayMinutes = attempt === 1 ? 5 : 15;
      await this.prisma.adminInvitation.update({
        where: { id },
        data: {
          emailStatus: retry ? "RETRY" : "FAILED",
          emailAttempts: attempt,
          lastEmailError: message.slice(0, 2000),
          nextEmailAttemptAt: retry ? new Date(Date.now() + delayMinutes * 60_000) : null,
        },
      });
      this.logger.warn(`Falha no envio do convite administrativo ${id} (tentativa ${attempt}/${MAX_EMAIL_ATTEMPTS}): ${message}`);
    }
  }

  private async retryPendingEmails() {
    try {
      const staleSendingBefore = new Date(Date.now() - 5 * 60_000);
      await this.prisma.adminInvitation.updateMany({
        where: { emailStatus: "SENDING", updatedAt: { lt: staleSendingBefore }, acceptedAt: null, expiresAt: { gt: new Date() } },
        data: { emailStatus: "RETRY", nextEmailAttemptAt: new Date() },
      });
      const pending = await this.prisma.adminInvitation.findMany({
        where: { emailStatus: "RETRY", acceptedAt: null, expiresAt: { gt: new Date() }, emailAttempts: { lt: MAX_EMAIL_ATTEMPTS }, nextEmailAttemptAt: { lte: new Date() } },
        select: { id: true },
        take: 20,
      });
      for (const item of pending) await this.deliverInvitation(item.id);
    } catch (error) {
      this.logger.error("Falha ao processar retentativas de convites administrativos.", error instanceof Error ? error.stack : String(error));
    }
  }

  async resendInvitation(actorUserId: string, id: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException("Convite administrativo não encontrado.");
    if (invitation.acceptedAt) throw new BadRequestException("Este convite já foi aceito.");
    if (invitation.expiresAt <= new Date()) throw new BadRequestException("Este convite expirou; crie um novo convite.");
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.prisma.adminInvitation.update({
      where: { id },
      data: { tokenHash, emailStatus: "PENDING", emailAttempts: 0, lastEmailError: null, nextEmailAttemptAt: new Date() },
    });
    await this.writeAudit(actorUserId, null, invitation.email, "ADMIN_INVITATION_RESEND_REQUESTED", { invitationId: id });
    await this.deliverInvitation(id, token);
    const updated = await this.prisma.adminInvitation.findUnique({ where: { id }, select: { emailStatus: true, emailAttempts: true } });
    const baseUrl = this.frontendBaseUrl();

    return {
      id,
      emailStatus: updated?.emailStatus ?? "PENDING",
      inviteUrl: updated?.emailStatus === "MANUAL" ? `${baseUrl}/accept-admin-invite?token=${token}` : undefined,
      message: updated?.emailStatus === "SENT" ? "Convite reenviado por e-mail." : updated?.emailStatus === "MANUAL" ? "Envio automático não configurado. Copie o link para enviar manualmente." : "O convite foi renovado; o sistema tentará enviar o e-mail automaticamente.",
    };
  }

  async cancelInvitation(actorUserId: string, id: string) {
    const invitation = await this.prisma.adminInvitation.findUnique({ where: { id } });
    if (!invitation) throw new NotFoundException("Convite administrativo não encontrado.");
    if (invitation.acceptedAt) throw new BadRequestException("Este convite já foi aceito.");
    await this.prisma.adminInvitation.update({ where: { id }, data: { expiresAt: new Date(), emailStatus: "CANCELLED", nextEmailAttemptAt: null } });
    await this.writeAudit(actorUserId, null, invitation.email, "ADMIN_INVITATION_CANCELLED", { invitationId: id });
    return { id, cancelled: true };
  }

  private async verifyCurrentPassword(actorUserId: string, currentPassword: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true, passwordHash: true, email: true } });
    if (!actor?.passwordHash || !(await compare(currentPassword, actor.passwordHash))) {
      throw new UnauthorizedException("Confirme sua senha atual para continuar.");
    }
    return actor;
  }

  async promote(actorUserId: string, targetUserId: string, currentPassword: string) {
    const actor = await this.verifyCurrentPassword(actorUserId, currentPassword);
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Cliente não encontrado.");
    if (!target.active || !target.passwordHash) throw new BadRequestException("O cliente precisa ter conta ativa e senha definida. Para novos acessos, envie um convite.");
    if (target.isAdmin || this.envAdminEmails().includes(target.email.trim().toLowerCase())) throw new ConflictException("Esta conta já possui acesso administrativo.");
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: targetUserId }, data: { isAdmin: true, authVersion: { increment: 1 } } });
      await tx.adminAuditLog.create({ data: { actorUserId, targetUserId, targetEmail: target.email, action: "ADMIN_PRIVILEGE_GRANTED" } });
    });
    return { id: targetUserId, email: target.email, isAdmin: true };
  }

  async revoke(actorUserId: string, targetUserId: string, currentPassword: string) {
    await this.verifyCurrentPassword(actorUserId, currentPassword);
    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException("Administrador não encontrado.");
    if (this.envAdminEmails().includes(target.email.trim().toLowerCase())) {
      throw new BadRequestException("Este administrador é mantido por ADMIN_EMAILS. Remova o e-mail da variável de ambiente antes de revogar o acesso.");
    }
    if (!target.isAdmin) throw new BadRequestException("Esta conta não possui privilégio administrativo.");

    await this.prisma.$transaction(async (tx) => {
      const admins = await tx.user.count({
        where: { active: true, passwordHash: { not: null }, OR: [{ isAdmin: true }, { email: { in: this.envAdminEmails() } }] },
      });
      if (target.active && target.passwordHash && admins <= 1) throw new BadRequestException("Não é possível revogar o último administrador ativo.");
      await tx.user.update({ where: { id: targetUserId }, data: { isAdmin: false, authVersion: { increment: 1 } } });
      await tx.adminAuditLog.create({
        data: { actorUserId, targetUserId, targetEmail: target.email, action: "ADMIN_PRIVILEGE_REVOKED" },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return { id: targetUserId, email: target.email, isAdmin: false, accountPreserved: true };
  }

  async createPasswordResetLink(actorUserId: string, targetUserId: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, active: true, passwordHash: true, authVersion: true },
    });
    if (!target) throw new NotFoundException("Conta não encontrada.");
    if (!target.passwordHash) throw new BadRequestException("Esta conta ainda não possui senha. Envie um convite para ativá-la.");
    const token = await this.jwt.signAsync(
      { sub: target.id, email: target.email, authVersion: target.authVersion, purpose: "password-reset" },
      { expiresIn: "30m" },
    );
    const baseUrl = this.frontendBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    let delivery: "sent" | "manual" = "manual";
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (apiKey && from) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [target.email],
            subject: "Redefinição de senha — Fabricante de Milhas",
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033"><h2>Redefina sua senha</h2><p>Foi solicitado um link para redefinir a senha da sua conta no Fabricante de Milhas.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#101a2b;color:#fff;text-decoration:none;border-radius:8px">Definir nova senha</a></p><p>O link é válido por 30 minutos e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore esta mensagem.</p></div>`,
          }),
        });
        if (response.ok) delivery = "sent";
        else this.logger.warn(`Não foi possível enviar redefinição de senha para ${target.email}: HTTP ${response.status}`);
      } catch (error) {
        this.logger.warn(`Falha no envio de redefinição de senha para ${target.email}: ${String(error)}`);
      }
    }
    await this.writeAudit(actorUserId, target.id, target.email, "PASSWORD_RESET_REQUESTED", { delivery, expiresInMinutes: 30 });
    return {
      resetUrl,
      delivery,
      message: delivery === "sent"
        ? "Link de redefinição enviado por e-mail. O link também está disponível para cópia por 30 minutos."
        : "Envio automático indisponível. Copie o link e envie ao destinatário por um canal seguro. Ele expira em 30 minutos.",
    };
  }

  async audit() {
    return this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, actorUserId: true, targetUserId: true, targetEmail: true, action: true, details: true, createdAt: true, actor: { select: { name: true, email: true } } },
    });
  }

  async acceptInvitation(dto: AcceptAdminInvitationDto) {
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");
    const now = new Date();
    const passwordHash = await hash(dto.password, 12);
    const acceptedUser = await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.adminInvitation.findUnique({ where: { tokenHash } });
      if (!invitation || invitation.acceptedAt || invitation.expiresAt <= now) throw new BadRequestException("Convite administrativo inválido, expirado ou já utilizado.");
      const email = invitation.email.trim().toLowerCase();
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing?.passwordHash) throw new ConflictException("Esta conta já existe. Entre em contato com o administrador para vincular o acesso.");
      const claimed = await tx.adminInvitation.updateMany({
        where: { id: invitation.id, acceptedAt: null, expiresAt: { gt: now } },
        data: { acceptedAt: now, emailStatus: "ACCEPTED", nextEmailAttemptAt: null },
      });
      if (claimed.count !== 1) throw new BadRequestException("Este convite já foi utilizado ou expirou.");
      const user = existing
        ? await tx.user.update({ where: { id: existing.id }, data: { name: dto.name.trim(), passwordHash, active: true, isAdmin: true, lastLoginAt: now, authVersion: { increment: 1 } } })
        : await tx.user.create({ data: { email, name: dto.name.trim(), passwordHash, active: true, isAdmin: true, lastLoginAt: now } });
      await tx.adminAuditLog.create({ data: { actorUserId: invitation.invitedByUserId, targetUserId: user.id, targetEmail: email, action: "ADMIN_INVITATION_ACCEPTED", details: { invitationId: invitation.id } } });
      return user;
    });
    const refreshToken = randomBytes(48).toString("base64url");
    const sessionCreatedAt = new Date();
    await this.prisma.userSession.create({ data: { userId: acceptedUser.id, refreshTokenHash: createHash("sha256").update(refreshToken).digest("hex"), authVersion: acceptedUser.authVersion, expiresAt: new Date(sessionCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000), lastUsedAt: sessionCreatedAt } });
    return {
      user: { id: acceptedUser.id, email: acceptedUser.email, name: acceptedUser.name, createdAt: acceptedUser.createdAt, isAdmin: true },
      accessToken: await this.jwt.signAsync({ sub: acceptedUser.id, email: acceptedUser.email, authVersion: acceptedUser.authVersion }, { expiresIn: "15m" }),
      refreshToken,
    };
  }
}
