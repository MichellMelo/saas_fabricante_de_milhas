import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminManagementController } from "./admin-management.controller";
import { AdminManagementService } from "./admin-management.service";
import { PageAccessController } from "./page-access.controller";

@Module({
  imports: [AuthModule],
  controllers: [AdminManagementController, PageAccessController],
  providers: [AdminManagementService],
  exports: [AdminManagementService],
})
export class AdminManagementModule {}
