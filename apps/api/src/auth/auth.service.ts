import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "node:crypto";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
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
       select: { id: true, email: true, name: true, createdAt: true },
      })
    : await tx.user.create({
       data: { email, passwordHash, name: emailName || invitation.name },
       select: { id: true, email: true, name: true, createdAt: true },
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

  return { user, accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email }) };
 }

 async login(dto: LoginDto) {
  const email = dto.email.trim().toLowerCase();
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user?.active || !user.passwordHash || !(await compare(dto.password, user.passwordHash))) {
   throw new UnauthorizedException("E-mail ou senha inválidos.");
  }
  return {
   user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
   accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email })
  };
 }

 async getPublicUser(userId: string) {
  const user = await this.prisma.user.findUnique({
   where: { id: userId },
   select: {
    id: true, email: true, name: true, active: true, createdAt: true,
    productAccesses: { select: { product: true, active: true, startsAt: true, expiresAt: true } },
   }
  });
  if (!user || !user.active) throw new UnauthorizedException("Conta inativa ou sessão inválida. Entre em contato com o administrador.");
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  const now = new Date();
  return {
   ...user,
   isAdmin: admins.includes(user.email.trim().toLowerCase()),
   productAccesses: user.productAccesses.filter((access) =>
    access.active && access.startsAt <= now && (!access.expiresAt || access.expiresAt > now)
   ),
  };
 }
}
