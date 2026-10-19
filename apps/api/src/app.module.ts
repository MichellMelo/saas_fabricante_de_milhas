import { ValidationPipe } from "@nestjs/common";
import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
 imports: [PrismaModule, AuthModule],
 controllers: [HealthController],
 providers: [{ provide: APP_PIPE, useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }) }]
})
export class AppModule {}