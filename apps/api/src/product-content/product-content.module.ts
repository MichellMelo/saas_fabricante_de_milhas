import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProductContentController } from "./product-content.controller";
import { ProductContentService } from "./product-content.service";

@Module({
  imports: [AuthModule],
  controllers: [ProductContentController],
  providers: [ProductContentService],
})
export class ProductContentModule {}
