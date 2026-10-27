import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MileFinanceController } from "./mile-finance.controller";
import { MileFinanceService } from "./mile-finance.service";

@Module({ imports: [AuthModule], controllers: [MileFinanceController], providers: [MileFinanceService] })
export class MileFinanceModule {}
