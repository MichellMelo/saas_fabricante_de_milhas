import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { assertPageAccess, isAdministrator, PAGE_ACCESS, PageKey } from "./page-permissions";

export type AuthenticatedRequest = Request & { user: { id: string; email: string; isAdmin: boolean; authVersion: number; allowedPages: string[] } };

@Injectable()
export class JwtAuthGuard implements CanActivate {
 constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService, private readonly reflector: Reflector) {}

 async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) throw new UnauthorizedException("Token de acesso obrigatório.");
  const token = authorization.slice(7).trim();
  if (!token) throw new UnauthorizedException("Token de acesso obrigatório.");
  const payload = await this.jwt.verifyAsync<{ sub: string; email: string; authVersion?: number }>(token).catch(() => {
   throw new UnauthorizedException("Token inválido ou expirado.");
  });
  if (!payload.sub || !payload.email) throw new UnauthorizedException("Token inválido ou expirado.");
  const user = await this.prisma.user.findUnique({
   where: { id: payload.sub },
   select: { id: true, email: true, active: true, isAdmin: true, authVersion: true },
  });
  if (!user?.active) throw new UnauthorizedException("Conta inativa ou sessão inválida.");
  if (payload.authVersion !== user.authVersion) throw new UnauthorizedException("Sua sessão foi invalidada. Entre novamente.");
  request.user = {
   id: user.id, email: user.email, isAdmin: isAdministrator(user), authVersion: user.authVersion,
   allowedPages: [],
  };
  const pages = this.reflector.getAllAndOverride<PageKey[] | true>(PAGE_ACCESS, [context.getHandler(), context.getClass()]);
  if (pages && !request.user.isAdmin) {
   const permissions = await this.prisma.userPagePermission.findMany({
    where: { userId: user.id, allowed: true },
    select: { page: true },
   });
   request.user.allowedPages = permissions.map(({ page }) => page);
  }
  if (pages && pages !== true) assertPageAccess(request.user, pages);
  return true;
 }
}
