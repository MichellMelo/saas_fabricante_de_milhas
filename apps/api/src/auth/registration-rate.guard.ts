import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import type { Request, Response } from "express";

const WINDOW_MS = 15 * 60 * 1000;
const ADDRESS_LIMIT = 20;
const TOTAL_LIMIT = 120;

@Injectable()
export class RegistrationRateGuard implements CanActivate {
 private readonly attempts = new Map<string, number>();
 private windowEndsAt = 0;
 private total = 0;

 canActivate(context: ExecutionContext) {
  const http = context.switchToHttp();
  const address = http.getRequest<Request>().socket.remoteAddress ?? "unknown";
  const now = Date.now();
  if (now >= this.windowEndsAt) {
   this.windowEndsAt = now + WINDOW_MS;
   this.attempts.clear();
   this.total = 0;
  }
  const attempts = this.attempts.get(address) ?? 0;
  if (attempts >= ADDRESS_LIMIT || this.total >= TOTAL_LIMIT) {
   http.getResponse<Response>().setHeader("Retry-After", Math.ceil((this.windowEndsAt - now) / 1000));
   throw new HttpException("Muitas tentativas de cadastro. Tente novamente em alguns minutos.", HttpStatus.TOO_MANY_REQUESTS);
  }
  this.attempts.set(address, attempts + 1);
  this.total++;
  return true;
 }
}
