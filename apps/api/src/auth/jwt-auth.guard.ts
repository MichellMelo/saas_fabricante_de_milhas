import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

export type AuthenticatedRequest = Request & { user: { id: string; email: string; isAdmin: boolean; authVersion: number } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
 constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

 async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Token de acesso obrigatório.");
  const token = authorization.slice(7).trim();
  if (!token) throw new UnauthorizedException("Token de acesso obrigatório.");
  try {
   const payload = await this.jwt.verifyAsync<{ sub: string; email: string; authVersion?: number }>(token);
   if (!payload.sub || !payload.email) throw new Error("Invalid token claims");
   const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, active: true, isAdmin: true, authVersion: true } });
   if (!user || !user.active) throw new UnauthorizedException("Conta inativa ou sessão inválida.");
   if (payload.authVersion !== user.authVersion) throw new UnauthorizedException("Sua sessão foi invalidada. Entre novamente.");
   const envAdmins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
   request.user = { id: user.id, email: user.email, isAdmin: user.isAdmin || envAdmins.includes(user.email.trim().toLowerCase()), authVersion: user.authVersion };
   return true;
  } catch (error) {
   if (error instanceof UnauthorizedException) throw error;
   throw new UnauthorizedException("Token inválido ou expirado.");
  }
 }
}