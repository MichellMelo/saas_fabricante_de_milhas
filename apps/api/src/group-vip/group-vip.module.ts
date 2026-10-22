import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { GroupVipController } from "./group-vip.controller";
import { GroupVipService } from "./group-vip.service";

@Module({
  imports: [AuthModule],
  controllers: [GroupVipController],
  providers: [GroupVipService],
})
export class GroupVipModule {}
