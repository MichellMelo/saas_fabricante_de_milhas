import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
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


 async resetPassword(dto: { token?: string; password?: string }) {
  const token = typeof dto.token === "string" ? dto.token : "";
  const password = typeof dto.password === "string" ? dto.password : "";
  if (!token) throw new BadRequestException("O link de redefinição está incompleto.");
  if (password.length < 8) throw new BadRequestException("A nova senha deve ter pelo menos 8 caracteres.");
  let payload: { sub: string; email: string; authVersion: number; purpose: string };
  try {
   payload = await this.jwt.verifyAsync(token);
  } catch {
   throw new BadRequestException("Link inválido ou expirado. Solicite uma nova redefinição.");
  }
  if (payload.purpose !== "password-reset" || !payload.sub || !payload.email || typeof payload.authVersion !== "number") {
   throw new BadRequestException("Link de redefinição inválido. Solicite um novo link.");
  }
  const user = await this.prisma.user.findUnique({
   where: { id: payload.sub },
   select: { id: true, email: true, authVersion: true },
  });
  if (!user || user.email !== payload.email || user.authVersion !== payload.authVersion) {
   throw new BadRequestException("Este link já foi utilizado ou não é mais válido. Solicite uma nova redefinição.");
  }
  const passwordHash = await hash(password, 12);
  await this.prisma.$transaction(async (tx) => {
   const changed = await tx.user.updateMany({
    where: { id: user.id, email: user.email, authVersion: payload.authVersion },
    data: { passwordHash, authVersion: { increment: 1 } },
   });
   if (changed.count !== 1) {
    throw new BadRequestException("Este link já foi utilizado ou não é mais válido. Solicite uma nova redefinição.");
   }
   await tx.adminAuditLog.create({
    data: { targetUserId: user.id, targetEmail: user.email, action: "PASSWORD_RESET_COMPLETED" },
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
