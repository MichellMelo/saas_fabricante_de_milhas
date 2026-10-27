import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FlightHistoryController } from "./flight-history.controller";
import { FlightHistoryService } from "./flight-history.service";
import { FlightHistoryIntegrationGuard } from "./flight-history-integration.guard";

@Module({ imports: [AuthModule], controllers: [FlightHistoryController], providers: [FlightHistoryService, FlightHistoryIntegrationGuard] })
export class FlightHistoryModule {}
