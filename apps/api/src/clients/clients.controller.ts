import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ClientsService } from "./clients.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { SetProductAccessDto } from "./dto/set-product-access.dto";

@UseGuards(JwtAuthGuard)
@Controller("admin")
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  private assertAdmin(request: AuthenticatedRequest) {
    const admins = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (!admins.includes(request.user.email.trim().toLowerCase())) {
      throw new ForbiddenException("Apenas administradores podem gerenciar clientes.");
    }
  }

  @Get("clients")
  listClients(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listClients();
  }

  @Get("clients/expiring-access")
  listExpiringAccesses(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listExpiringAccesses();
  }

  @Get("invitations")
  listInvitations(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listInvitations();
  }

  @Post("invitations")
  createInvitation(@Req() request: AuthenticatedRequest, @Body() dto: CreateInvitationDto) {
    this.assertAdmin(request);
    return this.clients.createInvitation(request.user.id, dto);
  }

  @Post("clients/:id/product-access")
  setProductAccess(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: SetProductAccessDto,
  ) {
    this.assertAdmin(request);
    return this.clients.setProductAccess(id, dto);
  }
}
