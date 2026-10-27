import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";

@Injectable()
export class FlightHistoryIntegrationGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>("FLIGHT_HISTORY_IMPORT_TOKEN");
    if (!expected || expected.length < 32) {
      throw new ServiceUnavailableException(
        "A integração do histórico de emissões não está configurada.",
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const supplied = request.headers["x-integration-token"];
    if (typeof supplied !== "string") {
      throw new UnauthorizedException("Token de integração inválido.");
    }

    const expectedBuffer = Buffer.from(expected, "utf8");
    const suppliedBuffer = Buffer.from(supplied, "utf8");
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException("Token de integração inválido.");
    }

    return true;
  }
}
