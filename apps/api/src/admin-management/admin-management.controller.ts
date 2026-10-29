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
  @Get("admin/administrators")
  list(@Req() request: AuthenticatedRequest) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.list();
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations")
  invite(@Req() request: AuthenticatedRequest, @Body() dto: CreateAdminInvitationDto) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.createInvitation(request.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/:id/promote")
  promote(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: AdminPasswordConfirmationDto) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.promote(request.user.id, id, dto.currentPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/:id/revoke")
  revoke(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: AdminPasswordConfirmationDto) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.revoke(request.user.id, id, dto.currentPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations/:id/cancel")
  cancelInvitation(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.cancelInvitation(request.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("admin/administrators/invitations/:id/resend")
  resendInvitation(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.resendInvitation(request.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("admin/administrators/audit")
  audit(@Req() request: AuthenticatedRequest) {
    this.admins.assertAdmin(request.user.id);
    return this.admins.audit();
  }

  @Post("auth/accept-admin-invitation")
  acceptInvitation(@Body() dto: AcceptAdminInvitationDto) {
    return this.admins.acceptInvitation(dto);
  }
}
