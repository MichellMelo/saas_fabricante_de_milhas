import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { LoyaltyProgramType } from "@prisma/client";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateAccountDto } from "./dto/create-account.dto";
import { CreateProgramDto } from "./dto/create-program.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { SetProgramActiveDto } from "./dto/set-program-active.dto";
import { LoyaltyService } from "./loyalty.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  private canManageCatalog(request: AuthenticatedRequest) {
    return request.user.isAdmin;
  }

  private assertCatalogAdmin(request: AuthenticatedRequest) {
    if (!this.canManageCatalog(request)) {
      throw new ForbiddenException("Somente administradores podem alterar o catálogo geral. Configure ADMIN_EMAILS no ambiente da API.");
    }
  }

  @Get("loyalty-programs")
  listPrograms(@Req() request: AuthenticatedRequest) {
    return this.loyalty.listPrograms(request.user.id);
  }

  @Get("loyalty-programs/manage")
  async listProgramsForManagement(@Req() request: AuthenticatedRequest) {
    const canManageCatalog = this.canManageCatalog(request);
    const programs = await this.loyalty.listProgramsForManagement(request.user.id, canManageCatalog);
    return { programs, canManageCatalog };
  }

  @Post("loyalty-programs/personal")
  createPersonalProgram(@Req() request: AuthenticatedRequest, @Body() dto: CreateProgramDto) {
    return this.loyalty.createPersonalProgram(request.user.id, dto.name, dto.type as LoyaltyProgramType);
  }

  @Post("loyalty-programs/catalog")
  createCatalogProgram(@Req() request: AuthenticatedRequest, @Body() dto: CreateProgramDto) {
    this.assertCatalogAdmin(request);
    return this.loyalty.createCatalogProgram(dto.name, dto.type as LoyaltyProgramType);
  }

  @Post("loyalty-programs/catalog/:id/update")
  updateCatalogProgram(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: CreateProgramDto,
  ) {
    this.assertCatalogAdmin(request);
    return this.loyalty.updateCatalogProgram(id, dto.name, dto.type as LoyaltyProgramType);
  }

  @Post("loyalty-programs/catalog/:id/active")
  setCatalogProgramActive(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: SetProgramActiveDto,
  ) {
    this.assertCatalogAdmin(request);
    return this.loyalty.setCatalogProgramActive(id, dto.active);
  }

  @Get("loyalty-accounts")
  listAccounts(@Req() request: AuthenticatedRequest) {
    return this.loyalty.listAccounts(request.user.id);
  }

  @Post("loyalty-accounts")
  createAccount(@Req() request: AuthenticatedRequest, @Body() dto: CreateAccountDto) {
    return this.loyalty.createAccount(request.user.id, dto);
  }

  @Delete("loyalty-accounts/:id")
  deleteAccount(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.loyalty.deleteAccount(request.user.id, id);
  }

  @Post("loyalty-accounts/:id/transactions")
  createTransaction(
    @Req() request: AuthenticatedRequest,
    @Param("id") accountId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.loyalty.createTransaction(request.user.id, accountId, dto);
  }
}
