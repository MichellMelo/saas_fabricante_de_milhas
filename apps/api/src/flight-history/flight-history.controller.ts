import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FlightHistoryIntegrationGuard } from "./flight-history-integration.guard";
import { FlightHistoryService } from "./flight-history.service";

@Controller("flight-availability")
export class FlightHistoryController {
 constructor(private readonly service: FlightHistoryService) {}

 @Get()
 @UseGuards(JwtAuthGuard)
 list(@Req() request: AuthenticatedRequest) {
  return this.service.list(request.user.id);
 }

 @Post("import")
 @UseGuards(JwtAuthGuard)
 import(@Req() request: AuthenticatedRequest, @Body() body: { records?: unknown[] }) {
  return this.service.importRecords(request.user.id, body?.records);
 }

 @Post("integration-import")
 @UseGuards(FlightHistoryIntegrationGuard)
 integrationImport(@Body() body: { records?: unknown[] }) {
  return this.service.importIntegrationRecords(body?.records);
 }
}
