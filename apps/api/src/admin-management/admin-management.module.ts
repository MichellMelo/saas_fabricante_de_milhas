import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminManagementController } from "./admin-management.controller";
import { AdminManagementService } from "./admin-management.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminManagementController],
  providers: [AdminManagementService],
  exports: [AdminManagementService],
})
export class AdminManagementModule {}
