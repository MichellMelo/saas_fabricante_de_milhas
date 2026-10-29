import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
 @Get()
 getHealth() {
  return { status: "ok", service: "fabricante-de-milhas-api", timestamp: new Date().toISOString() };
 }
}
