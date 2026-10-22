import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateAccountDto } from "./dto/create-account.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { LoyaltyService } from "./loyalty.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get("loyalty-programs")
  listPrograms() {
    return this.loyalty.listPrograms();
  }

  @Get("loyalty-accounts")
  listAccounts(@Req() request: AuthenticatedRequest) {
    return this.loyalty.listAccounts(request.user.id);
  }

  @Post("loyalty-accounts")
  createAccount(@Req() request: AuthenticatedRequest, @Body() dto: CreateAccountDto) {
    return this.loyalty.createAccount(request.user.id, dto);
  }

  @Post("loyalty-accounts/:id/transactions")
  createTransaction(
    @Req() request: AuthenticatedRequest,
    @Param("id") accountId: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.loyalty.createTransaction(request.user.id, accountId, dto);
  }
}
