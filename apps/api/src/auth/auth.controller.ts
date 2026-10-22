import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard, AuthenticatedRequest } from "./jwt-auth.guard";
import { AcceptInvitationDto } from "./dto/accept-invitation.dto";
import { LoginDto } from "./dto/login.dto";

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

 @Post("login")
 login(@Body() dto: LoginDto) {
  return this.auth.login(dto);
 }

 @UseGuards(JwtAuthGuard)
 @Get("me")
 async me(@Req() request: AuthenticatedRequest) {
  return { user: await this.auth.getPublicUser(request.user.id) };
 }
}
