import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PersonalTravelController } from "./personal-travel.controller";
import { PersonalTravelService } from "./personal-travel.service";

@Module({
  imports: [AuthModule],
  controllers: [PersonalTravelController],
  providers: [PersonalTravelService],
})
export class PersonalTravelModule {}
