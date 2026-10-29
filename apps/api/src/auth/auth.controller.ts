import { Body, Controller, Get, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard, AuthenticatedRequest } from "./jwt-auth.guard";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@Controller("auth")
export class AuthController {
 constructor(private readonly auth: AuthService) {}

 @Post("register")
 register() {
  return this.auth.register();
 }

 @Post("accept-invitation")
 acceptInvitation(@Body() dto: AcceptInvitationDto) {
  return this.auth.acceptInvitation(dto);
 }

 @Post("reset-password")
 resetPassword(@Body() body: { token?: string; password?: string }) {
  return this.auth.resetPassword(body);
 }

 @Post("login")
 login(@Body() dto: LoginDto) {
  return this.auth.login(dto);
 }

 @UseGuards(JwtAuthGuard)
 @Patch("profile")
 updateProfile(@Req() request: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
  return this.auth.updateProfile(request.user.id, dto);
 }

 @UseGuards(JwtAuthGuard)
 @Post("change-password")
 changePassword(@Req() request: AuthenticatedRequest, @Body() dto: ChangePasswordDto) {
  return this.auth.changePassword(request.user.id, dto);
 }

 @UseGuards(JwtAuthGuard)
 @Get("me")
 async me(@Req() request: AuthenticatedRequest) {
  return { user: await this.auth.getPublicUser(request.user.id) };
 }
}
