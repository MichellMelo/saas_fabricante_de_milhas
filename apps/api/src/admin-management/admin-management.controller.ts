import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AcceptAdminInvitationDto } from "./dto/accept-admin-invitation.dto";
import { AdminPasswordConfirmationDto } from "./dto/admin-password-confirmation.dto";
import { CreateAdminInvitationDto } from "./dto/create-admin-invitation.dto";
import { AdminManagementService } from "./admin-management.service";

@Controller()
export class AdminManagementController {
  constructor(private readonly admins: AdminManagementService) {}

  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:id/password-reset")
  async requestPasswordReset(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.createPasswordResetLink(request.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/administrators")
  async list(@Req() request: AuthenticatedRequest) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.list();
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations")
  async invite(@Req() request: AuthenticatedRequest, @Body() dto: CreateAdminInvitationDto) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.createInvitation(request.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/:id/promote")
  async promote(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: AdminPasswordConfirmationDto) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.promote(request.user.id, id, dto.currentPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/:id/revoke")
  async revoke(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: AdminPasswordConfirmationDto) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.revoke(request.user.id, id, dto.currentPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations/:id/cancel")
  async cancelInvitation(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.cancelInvitation(request.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations/:id/resend")
  async resendInvitation(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.resendInvitation(request.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/administrators/audit")
  async audit(@Req() request: AuthenticatedRequest) {
    await this.admins.assertAdmin(request.user.id);
    return this.admins.audit();
  }

  @Post("auth/accept-admin-invitation")
  acceptInvitation(@Body() dto: AcceptAdminInvitationDto) {
    return this.admins.acceptInvitation(dto);
  }
}
