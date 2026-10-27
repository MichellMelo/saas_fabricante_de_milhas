import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FlightHistoryService } from "./flight-history.service";

@UseGuards(JwtAuthGuard)
@Controller("flight-availability")
export class FlightHistoryController {
 constructor(private readonly service: FlightHistoryService) {}

 @Get()
 list(@Req() request: AuthenticatedRequest) {
  return this.service.list(request.user.id);
 }

 @Post("import")
 import(@Req() request: AuthenticatedRequest, @Body() body: { records?: unknown[] }) {
  return this.service.importRecords(request.user.id, body?.records);
 }
}
