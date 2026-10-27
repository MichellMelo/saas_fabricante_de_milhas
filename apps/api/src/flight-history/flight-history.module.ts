import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FlightHistoryController } from "./flight-history.controller";
import { FlightHistoryService } from "./flight-history.service";

@Module({ imports: [AuthModule], controllers: [FlightHistoryController], providers: [FlightHistoryService] })
export class FlightHistoryModule {}
