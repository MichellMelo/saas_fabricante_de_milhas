import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PersonalTravelService } from "./personal-travel.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class PersonalTravelController {
  constructor(private readonly service: PersonalTravelService) {}

  @Get("personal-trips")
  listTrips(@Req() request: AuthenticatedRequest) {
    return this.service.listTrips(request.user.id);
  }

  @Post("personal-trips")
  createTrip(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.service.createTrip(request.user.id, body);
  }

  @Patch("personal-trips/:id")
  updateTrip(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateTrip(request.user.id, id, body);
  }

  @Delete("personal-trips/:id")
  deleteTrip(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.deleteTrip(request.user.id, id);
  }

  @Get("personal-redemptions/audit")
  listAudit(@Req() request: AuthenticatedRequest, @Query("redemptionId") redemptionId?: string) {
    return this.service.listAudit(request.user.id, redemptionId);
  }

  @Get("personal-redemptions")
  listRedemptions(@Req() request: AuthenticatedRequest, @Query("trash") trash?: string) {
    return this.service.listRedemptions(request.user.id, trash === "true");
  }

  @Post("personal-redemptions")
  createRedemption(@Req() request: AuthenticatedRequest, @Body() body: Record<string, unknown>) {
    return this.service.createRedemption(request.user.id, body);
  }

  @Patch("personal-redemptions/:id")
  updateRedemption(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() body: Record<string, unknown>) {
    return this.service.updateRedemption(request.user.id, id, body);
  }

  @Delete("personal-redemptions/:id")
  moveToTrash(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.moveToTrash(request.user.id, id);
  }

  @Post("personal-redemptions/:id/restore")
  restoreRedemption(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.restoreRedemption(request.user.id, id);
  }

  @Post("personal-redemptions/:id/permanent-delete")
  permanentlyDelete(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.service.permanentlyDelete(request.user.id, id);
  }
}
