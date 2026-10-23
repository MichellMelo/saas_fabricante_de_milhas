import { Module, ValidationPipe } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "node:path";
import { AuthModule } from "./auth/auth.module";
import { ClientsModule } from "./clients/clients.module";
import { GroupVipModule } from "./group-vip/group-vip.module";
import { HealthController } from "./health.controller";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProductContentModule } from "./product-content/product-content.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, "../../.env"),
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    GroupVipModule,
    ProductContentModule,
    LoyaltyModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
  ],
})
export class AppModule {}
