import { BadRequestException, Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

type ImportRecord = { dateRegistered: string; program: string; cabinClass: string; origin: string; destination: string; milesFloor: number; monthsAvailable: string; outboundDates: string; returnDates: string };

@Injectable()
export class FlightHistoryService {
 constructor(private readonly prisma: PrismaService) {}

 async list(userId: string) {
  const records = await this.prisma.flightAvailability.findMany({ where: { userId }, orderBy: [{ dateRegistered: "desc" }, { origin: "asc" }, { destination: "asc" }], take: 2000 });
  return { records, total: records.length };
 }

 async importRecords(userId: string, rawRecords: unknown[] | undefined) {
  if (!Array.isArray(rawRecords) || rawRecords.length === 0) throw new BadRequestException("O arquivo não contém registros para importar.");
  if (rawRecords.length > 2000) throw new BadRequestException("Importe no máximo 2.000 registros por vez.");
  const records: ImportRecord[] = rawRecords.map((raw, index) => {
   if (!raw || typeof raw !== "object") throw new BadRequestException(`Registro ${index + 1} inválido.`);
   const row = raw as Record<string, unknown>;
   const text = (key: string, max: number) => { const value = String(row[key] ?? "").trim(); if (value.length > max) throw new BadRequestException(`Campo ${key} muito longo no registro ${index + 1}.`); return value; };
   const dateRegistered = text("dateRegistered", 30);
   const parsedDate = new Date(dateRegistered);
   const program = text("program", 100), cabinClass = text("cabinClass", 50);
   const origin = text("origin", 3).toUpperCase(), destination = text("destination", 3).toUpperCase();
   const milesFloor = Number(row.milesFloor);
   if (!dateRegistered || Number.isNaN(parsedDate.getTime()) || !program || !cabinClass || !/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || !Number.isSafeInteger(milesFloor) || milesFloor < 0) throw new BadRequestException(`Dados obrigatórios inválidos no registro ${index + 1}.`);
   return { dateRegistered: parsedDate.toISOString(), program, cabinClass, origin, destination, milesFloor, monthsAvailable: text("monthsAvailable", 5000), outboundDates: text("outboundDates", 10000), returnDates: text("returnDates", 10000) };
  });
  const data = records.map((record) => {
   const fingerprint = createHash("sha256").update(JSON.stringify([record.dateRegistered, record.program.toLowerCase(), record.cabinClass.toLowerCase(), record.origin, record.destination, record.milesFloor, record.monthsAvailable, record.outboundDates, record.returnDates])).digest("hex");
   return { userId, fingerprint, dateRegistered: new Date(record.dateRegistered), program: record.program, cabinClass: record.cabinClass, origin: record.origin, destination: record.destination, milesFloor: record.milesFloor, monthsAvailable: record.monthsAvailable, outboundDates: record.outboundDates, returnDates: record.returnDates };
  });
  const result = await this.prisma.flightAvailability.createMany({ data, skipDuplicates: true });
  const total = await this.prisma.flightAvailability.count({ where: { userId } });
  return { imported: result.count, skipped: records.length - result.count, total, message: result.count ? `${result.count} registro(s) importado(s) com sucesso.` : "Todos os registros já existiam; nenhum duplicado foi criado." };
 }
}
