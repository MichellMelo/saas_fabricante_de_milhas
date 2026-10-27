import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ClientsService } from "./clients.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { SetProductAccessDto } from "./dto/set-product-access.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { CreateClientPaymentDto } from "./dto/create-client-payment.dto";
import { CreateMileSaleDto } from "./dto/create-mile-sale.dto";
import { UpdateMileSaleStatusDto } from "./dto/update-mile-sale-status.dto";

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

  @Post("clients")
  createClient(@Req() request: AuthenticatedRequest, @Body() dto: CreateClientDto) {
    this.assertAdmin(request);
    return this.clients.createClient(dto);
  }

  @Post("clients/:id")
  updateClient(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateClientDto) {
    this.assertAdmin(request);
    return this.clients.updateClient(id, dto);
  }

  @Get("mile-sales")
  listMileSales(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listMileSales();
  }

  @Post("mile-sales")
  createMileSale(@Req() request: AuthenticatedRequest, @Body() dto: CreateMileSaleDto) {
    this.assertAdmin(request);
    return this.clients.createMileSale(request.user.id, dto);
  }

  @Put("mile-sales/:id")
  updateMileSale(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: CreateMileSaleDto) {
    this.assertAdmin(request);
    return this.clients.updateMileSale(id, dto);
  }

  @Delete("mile-sales/:id")
  deleteMileSale(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertAdmin(request);
    return this.clients.deleteMileSale(id);
  }

  @Post("mile-sales/:id/status")
  setMileSaleStatus(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateMileSaleStatusDto) {
    this.assertAdmin(request);
    return this.clients.setMileSaleStatus(id, dto.status);
  }

  @Get("payments")
  listPayments(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listPayments();
  }

  @Post("payments")
  createPayment(@Req() request: AuthenticatedRequest, @Body() dto: CreateClientPaymentDto) {
    this.assertAdmin(request);
    return this.clients.createPayment(dto);
  }

  @Put("payments/:id")
  updatePayment(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: CreateClientPaymentDto) {
    this.assertAdmin(request);
    return this.clients.updatePayment(id, dto);
  }

  @Delete("payments/:id")
  deletePayment(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertAdmin(request);
    return this.clients.deletePayment(id);
  }

  @Post("payments/:id/status")
  setPaymentPaid(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: { paid?: boolean }) {
    this.assertAdmin(request);
    if (typeof body.paid !== "boolean") {
      throw new ForbiddenException("Informe se o lançamento foi pago.");
    }
    return this.clients.setPaymentPaid(id, body.paid);
  }

  @Get("clients")
  listClients(@Req() request: AuthenticatedRequest) {
    this.assertAdmin(request);
    return this.clients.listClients();
  }

  @Post("clients/:id/status")
  setClientStatus(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: { active?: boolean }) {
    this.assertAdmin(request);
    if (typeof body.active !== "boolean") {
      throw new ForbiddenException("Informe se a conta deve ficar ativa ou inativa.");
    }
    return this.clients.setClientStatus(id, body.active);
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

  @Post("invitations/:id/cancel")
  cancelInvitation(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertAdmin(request);
    return this.clients.cancelInvitation(id);
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
