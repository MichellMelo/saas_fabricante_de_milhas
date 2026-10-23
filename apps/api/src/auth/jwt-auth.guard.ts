import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";

export type AuthenticatedRequest = Request & { user: { id: string; email: string } };

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
   const payload = await this.jwt.verifyAsync<{ sub: string; email: string }>(token);
   if (!payload.sub || !payload.email) throw new Error("Invalid token claims");
   const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { active: true } });
   if (!user || !user.active) throw new UnauthorizedException("Conta inativa ou sessão inválida.");
   request.user = { id: payload.sub, email: payload.email };
   return true;
  } catch (error) {
   if (error instanceof UnauthorizedException) throw error;
   throw new UnauthorizedException("Token inválido ou expirado.");
  }
 }
}