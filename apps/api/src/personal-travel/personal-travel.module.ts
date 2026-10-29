import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PersonalTravelController } from "./personal-travel.controller";
import { PersonalTravelService } from "./personal-travel.service";
import { AirportCatalogService } from "./airport-catalog.service";

@Module({
  imports: [AuthModule],
  controllers: [PersonalTravelController],
  providers: [PersonalTravelService, AirportCatalogService],
})
export class PersonalTravelModule {}
