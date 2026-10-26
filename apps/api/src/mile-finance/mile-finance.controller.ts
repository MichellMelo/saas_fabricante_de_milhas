import { Body, Controller, Get, Post, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";
import { CreateMilePurchaseDto } from "./dto/create-mile-purchase.dto";
import { CreatePersonalMileSaleDto } from "./dto/create-mile-sale.dto";
import { MileFinanceService } from "./mile-finance.service";

@UseGuards(JwtAuthGuard)
@Controller("mile-finance")
export class MileFinanceController {
  constructor(private readonly finance: MileFinanceService) {}

  @Get("dashboard")
  dashboard(@Req() request: AuthenticatedRequest, @Query("from") from?: string, @Query("to") to?: string) {
    return this.finance.dashboard(request.user.id, from, to);
  }

  @Get("inventory")
  inventory(@Req() request: AuthenticatedRequest) {
    return this.finance.listInventory(request.user.id);
  }

  @Get("purchases")
  purchases(@Req() request: AuthenticatedRequest, @Query("from") from?: string, @Query("to") to?: string) {
    return this.finance.listPurchases(request.user.id, from, to);
  }

  @Post("purchases")
  createPurchase(@Req() request: AuthenticatedRequest, @Body() dto: CreateMilePurchaseDto) {
    return this.finance.createPurchase(request.user.id, dto);
  }

  @Get("sales")
  sales(@Req() request: AuthenticatedRequest, @Query("from") from?: string, @Query("to") to?: string) {
    return this.finance.listSales(request.user.id, from, to);
  }

  @Post("sales")
  createSale(@Req() request: AuthenticatedRequest, @Body() dto: CreatePersonalMileSaleDto) {
    return this.finance.createSale(request.user.id, dto);
  }

  @Get("movements")
  movements(@Req() request: AuthenticatedRequest, @Query("from") from?: string, @Query("to") to?: string) {
    return this.finance.listMovements(request.user.id, from, to);
  }

  @Post("inventory/adjustments")
  createAdjustment(@Req() request: AuthenticatedRequest, @Body() dto: CreateInventoryAdjustmentDto) {
    return this.finance.createAdjustment(request.user.id, dto);
  }
}
