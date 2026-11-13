import { BadRequestException, Body, Controller, ForbiddenException, Get, NotFoundException, Param, Put, Query, Req, UseGuards } from "@nestjs/common";
import { IsBoolean } from "class-validator";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { isAdministrator, isPageKey, pageGroups } from "../auth/page-permissions";
import { PrismaService } from "../prisma/prisma.service";

class SetPageAccessDto {
  @IsBoolean()
  allowed!: boolean;
}

@UseGuards(JwtAuthGuard)
@Controller("admin/page-access")
export class PageAccessController {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    if (!request.user.isAdmin) throw new ForbiddenException("Apenas administradores podem controlar acessos.");
  }

  @Get()
  async search(@Req() request: AuthenticatedRequest, @Query("q") query?: string) {
    this.assertAdmin(request);
    if (query !== undefined && (typeof query !== "string" || query.length > 254)) {
      throw new BadRequestException("Pesquisa inválida.");
    }
    const search = query?.trim();
    const users = await this.prisma.user.findMany({
      where: search ? {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      } : undefined,
      orderBy: [{ name: "asc" }, { email: "asc" }],
      take: 50,
      select: { id: true, email: true, name: true, active: true, isAdmin: true },
    });
    return {
      groups: pageGroups,
      users: users.map((user) => ({ ...user, isAdmin: isAdministrator(user) })),
    };
  }

  @Get(":id")
  async get(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertAdmin(request);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        email: true, isAdmin: true,
        pagePermissions: { where: { allowed: true }, select: { page: true } },
        productAccesses: { select: { product: true, active: true, startsAt: true, expiresAt: true } },
      },
    });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    const now = new Date();
    return {
      isAdmin: isAdministrator(user),
      allowedPages: user.pagePermissions.map(({ page }) => page),
      activeProducts: user.productAccesses
        .filter(({ active, startsAt, expiresAt }) => active && startsAt <= now && (!expiresAt || expiresAt > now))
        .map(({ product }) => product),
    };
  }

  @Put(":id/:page")
  async set(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("page") page: string,
    @Body() { allowed }: SetPageAccessDto,
  ) {
    this.assertAdmin(request);
    if (!isPageKey(page)) throw new BadRequestException("Página inválida.");
    if (id === request.user.id) throw new ForbiddenException("Seu próprio acesso é protegido.");

    return this.prisma.$transaction(async (transaction) => {
      const users = await transaction.$queryRaw<{ id: string; email: string; isAdmin: boolean; active: boolean; authVersion: number }[]>`
        SELECT "id", "email", "isAdmin", "active", "authVersion" FROM "User"
        WHERE "id" IN (${id}, ${request.user.id}) ORDER BY "id" FOR UPDATE
      `;
      const actor = users.find((user) => user.id === request.user.id);
      if (!actor?.active || actor.authVersion !== request.user.authVersion || !isAdministrator(actor)) {
        throw new ForbiddenException("A sessão perdeu a permissão de controlar acessos.");
      }
      const target = users.find((user) => user.id === id);
      if (!target) throw new NotFoundException("Usuário não encontrado.");
      if (isAdministrator(target)) throw new ForbiddenException("O acesso de administradores é protegido.");
      const permission = await transaction.userPagePermission.upsert({
        where: { userId_page: { userId: id, page } },
        create: { userId: id, page, allowed },
        update: { allowed },
        select: { page: true, allowed: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorUserId: request.user.id, targetUserId: id, targetEmail: target.email,
          action: "PAGE_ACCESS_CHANGED", details: permission,
        },
      });
      return permission;
    });
  }
}
