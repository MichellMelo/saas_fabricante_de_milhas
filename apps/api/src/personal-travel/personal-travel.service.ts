import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PersonalRedemptionStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type Payload = Record<string, unknown>;
const statuses = new Set<string>(Object.values(PersonalRedemptionStatus));
const asText = (value: unknown, field: string, max = 2048, required = false) => {
  const result = String(value ?? "").trim();
  if (required && !result) throw new BadRequestException(`Informe ${field}.`);
  if (result.length > max) throw new BadRequestException(`${field} excede o limite permitido.`);
  return result;
};
const asDate = (value: unknown, field: string, required = true): Date | null => {
  if ((value === undefined || value === null || value === "") && !required) return null;
  const date = new Date(String(value));
  if (!value || Number.isNaN(date.getTime())) throw new BadRequestException(`Informe uma data válida para ${field}.`);
  return date;
};
const airport = (value: unknown, field: string) => {
  const code = asText(value, field, 3, true).toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) throw new BadRequestException(`${field} deve ser um código IATA de três letras.`);
  return code;
};
const nonNegativeInt = (value: unknown, field: string) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new BadRequestException(`${field} deve ser um inteiro não negativo.`);
  return number;
};
const nonNegativeMoney = (value: unknown, field: string, optional = false) => {
  if (optional && (value === null || value === undefined || value === "")) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 9999999999) throw new BadRequestException(`${field} deve ser um valor monetário não negativo.`);
  return number.toFixed(2);
};

@Injectable()
export class PersonalTravelService {
  constructor(private readonly prisma: PrismaService) {}

  async listTrips(userId: string) {
    return this.prisma.personalTrip.findMany({
      where: { userId },
      include: { passengers: { orderBy: { createdAt: "asc" } }, _count: { select: { redemptions: true } } },
      orderBy: [{ outboundDate: "desc" }, { createdAt: "desc" }],
    });
  }

  async createTrip(userId: string, body: Payload) {
    const origin = airport(body.origin, "origem");
    const destination = airport(body.destination, "destino");
    const outboundDate = asDate(body.outboundDate, "data de ida")!;
    const returnDate = asDate(body.returnDate, "data de volta", false);
    if (returnDate && returnDate < outboundDate) throw new BadRequestException("A data de volta não pode anteceder a data de ida.");
    const passengers = this.parsePassengers(body.passengers);
    return this.prisma.personalTrip.create({
      data: {
        userId, origin, destination, outboundDate, returnDate,
        title: asText(body.title, "título", 180) || null,
        notes: asText(body.notes, "observações", 10000) || null,
        passengers: { create: passengers.map((name) => ({ name })) },
      },
      include: { passengers: true, _count: { select: { redemptions: true } } },
    });
  }

  async updateTrip(userId: string, id: string, body: Payload) {
    const existing = await this.prisma.personalTrip.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Viagem não encontrada.");
    const origin = body.origin === undefined ? existing.origin : airport(body.origin, "origem");
    const destination = body.destination === undefined ? existing.destination : airport(body.destination, "destino");
    const outboundDate = body.outboundDate === undefined ? existing.outboundDate : asDate(body.outboundDate, "data de ida")!;
    const returnDate = body.returnDate === undefined ? existing.returnDate : asDate(body.returnDate, "data de volta", false);
    if (returnDate && returnDate < outboundDate) throw new BadRequestException("A data de volta não pode anteceder a data de ida.");
    const passengerNames = body.passengers === undefined ? null : this.parsePassengers(body.passengers);
    return this.prisma.$transaction(async (tx) => {
      if (passengerNames) {
        await tx.personalTripPassenger.deleteMany({ where: { tripId: id } });
      }
      return tx.personalTrip.update({
        where: { id },
        data: {
          origin, destination, outboundDate, returnDate,
          ...(body.title !== undefined ? { title: asText(body.title, "título", 180) || null } : {}),
          ...(body.notes !== undefined ? { notes: asText(body.notes, "observações", 10000) || null } : {}),
          ...(passengerNames ? { passengers: { create: passengerNames.map((name) => ({ name })) } } : {}),
        },
        include: { passengers: true, _count: { select: { redemptions: true } } },
      });
    });
  }

  async deleteTrip(userId: string, id: string) {
    const trip = await this.prisma.personalTrip.findFirst({ where: { id, userId }, include: { redemptions: true } });
    if (!trip) throw new NotFoundException("Viagem não encontrada.");
    await this.prisma.$transaction(async (tx) => {
      await tx.personalRedemption.updateMany({ where: { tripId: id, userId }, data: { tripId: null } });
      await tx.personalTrip.delete({ where: { id } });
    });
    return { success: true, unlinkedRedemptions: trip.redemptions.length };
  }

  async listRedemptions(userId: string, trash = false) {
    await this.purgeExpiredTrash(userId);
    const where: Prisma.PersonalRedemptionWhereInput = trash
      ? { userId, deletedAt: { not: null } }
      : { userId, deletedAt: null };
    const records = await this.prisma.personalRedemption.findMany({
      where,
      include: { trip: { include: { passengers: { orderBy: { createdAt: "asc" } } } } },
      orderBy: [{ issuanceDate: "desc" }, { createdAt: "desc" }],
    });
    return { records, total: records.length };
  }

  async createRedemption(userId: string, body: Payload) {
    const data = this.parseRedemption(body);
    if (data.tripId) await this.assertOwnedTrip(userId, data.tripId);
    const created = await this.prisma.personalRedemption.create({ data: { ...data, userId } });
    await this.writeAudit(userId, created, "CREATE", null, null, null);
    return this.prisma.personalRedemption.findUnique({
      where: { id: created.id },
      include: { trip: { include: { passengers: true } } },
    });
  }

  async updateRedemption(userId: string, id: string, body: Payload) {
    const existing = await this.prisma.personalRedemption.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Resgate não encontrado.");
    const data = this.parseRedemption(body, existing);
    if (data.tripId) await this.assertOwnedTrip(userId, data.tripId);
    const updated = await this.prisma.personalRedemption.update({ where: { id }, data });
    const auditFields: (keyof typeof data)[] = ["origin", "destination", "issuanceDate", "outboundDate", "returnDate", "program", "cabin", "milesUsed", "feesPaid", "cashReferencePrice", "cashReferenceDate", "cashReferenceSource", "bookingLocator", "status", "notes", "tripId"];
    for (const field of auditFields) {
      if (data[field] !== undefined && String(existing[field as keyof typeof existing] ?? "") !== String(data[field] ?? "")) {
        await this.writeAudit(userId, updated, "UPDATE", String(field), existing[field as keyof typeof existing], data[field]);
      }
    }
    return this.prisma.personalRedemption.findUnique({
      where: { id },
      include: { trip: { include: { passengers: true } } },
    });
  }

  async moveToTrash(userId: string, id: string) {
    const existing = await this.prisma.personalRedemption.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Resgate não encontrado.");
    const updated = await this.prisma.personalRedemption.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.writeAudit(userId, updated, "TRASH", null, null, null);
    return { success: true, deletedAt: updated.deletedAt };
  }

  async restoreRedemption(userId: string, id: string) {
    const existing = await this.prisma.personalRedemption.findFirst({ where: { id, userId, deletedAt: { not: null } } });
    if (!existing) throw new NotFoundException("Resgate não encontrado na lixeira.");
    const deadline = new Date(existing.deletedAt!.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > deadline) throw new BadRequestException("O prazo de restauração de 30 dias terminou.");
    const updated = await this.prisma.personalRedemption.update({ where: { id }, data: { deletedAt: null } });
    await this.writeAudit(userId, updated, "RESTORE", null, null, null);
    return { success: true };
  }

  async permanentlyDelete(userId: string, id: string) {
    const existing = await this.prisma.personalRedemption.findFirst({ where: { id, userId, deletedAt: { not: null } } });
    if (!existing) throw new NotFoundException("Somente resgates na lixeira podem ser excluídos definitivamente.");
    await this.prisma.$transaction(async (tx) => {
      await tx.personalRedemptionAudit.create({
        data: {
          redemptionId: id, redemptionLabel: `${existing.origin}-${existing.destination} · ${existing.program}`,
          actorUserId: userId, action: "PERMANENT_DELETE",
        },
      });
      await tx.personalRedemption.delete({ where: { id } });
    });
    return { success: true };
  }

  async listAudit(actorUserId: string, redemptionId?: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorUserId }, select: { email: true } });
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (!actor || !admins.includes(actor.email.toLowerCase())) throw new ForbiddenException("A consulta de auditoria é restrita à administração.");
    return this.prisma.personalRedemptionAudit.findMany({
      where: redemptionId ? { redemptionId } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  private async purgeExpiredTrash(userId: string) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const expired = await this.prisma.personalRedemption.findMany({
      where: { userId, deletedAt: { lte: cutoff } },
      select: { id: true, origin: true, destination: true, program: true },
    });
    if (!expired.length) return;
    await this.prisma.$transaction(async (tx) => {
      await tx.personalRedemptionAudit.createMany({
        data: expired.map((item) => ({
          redemptionId: item.id,
          redemptionLabel: `${item.origin}-${item.destination} · ${item.program}`,
          actorUserId: userId,
          action: "AUTO_PURGE",
        })),
      });
      await tx.personalRedemption.deleteMany({
        where: { userId, id: { in: expired.map((item) => item.id) } },
      });
    });
  }

  private parsePassengers(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) throw new BadRequestException("Passageiros deve ser uma lista de nomes.");
    if (value.length > 20) throw new BadRequestException("Cadastre no máximo 20 passageiros por viagem.");
    const names = value.map((item) => asText(item, "nome do passageiro", 180, true));
    if (new Set(names.map((name) => name.toLocaleLowerCase("pt-BR"))).size !== names.length) {
      throw new BadRequestException("Remova nomes de passageiros duplicados.");
    }
    return names;
  }

  private parseRedemption(body: Payload, existing?: Prisma.PersonalRedemptionGetPayload<{}>) {
    const origin = body.origin === undefined && existing ? existing.origin : airport(body.origin, "origem");
    const destination = body.destination === undefined && existing ? existing.destination : airport(body.destination, "destino");
    const issuanceDate = body.issuanceDate === undefined && existing ? existing.issuanceDate : asDate(body.issuanceDate, "data de emissão")!;
    const outboundDate = body.outboundDate === undefined && existing ? existing.outboundDate : asDate(body.outboundDate, "data de ida")!;
    const returnDate = body.returnDate === undefined && existing ? existing.returnDate : asDate(body.returnDate, "data de volta", false);
    if (returnDate && returnDate < outboundDate) throw new BadRequestException("A data de volta não pode anteceder a data de ida.");
    if (origin === destination && body.allowSameRoute !== true) throw new BadRequestException("Origem e destino são iguais. Corrija a rota ou confirme explicitamente a exceção.");
    const statusRaw = body.status === undefined && existing ? existing.status : String(body.status ?? "ISSUED");
    if (!statuses.has(statusRaw)) throw new BadRequestException("Status de resgate inválido.");
    const tripId = body.tripId === undefined && existing ? existing.tripId : (asText(body.tripId, "viagem", 100) || null);
    const program = body.program === undefined && existing ? existing.program : asText(body.program, "programa de fidelidade", 100, true);
    const cabin = body.cabin === undefined && existing ? existing.cabin : asText(body.cabin, "cabine", 40, true);
    const milesUsed = body.milesUsed === undefined && existing ? existing.milesUsed : nonNegativeInt(body.milesUsed, "milhas utilizadas");
    const feesPaid = body.feesPaid === undefined && existing ? existing.feesPaid.toString() : nonNegativeMoney(body.feesPaid, "taxas pagas")!;
    const cashReferencePrice = body.cashReferencePrice === undefined && existing ? existing.cashReferencePrice?.toString() ?? null : nonNegativeMoney(body.cashReferencePrice, "preço de referência", true);
    const cashReferenceDate = body.cashReferenceDate === undefined && existing ? existing.cashReferenceDate : asDate(body.cashReferenceDate, "data da referência", false);
    const cashReferenceSource = body.cashReferenceSource === undefined && existing ? existing.cashReferenceSource : (asText(body.cashReferenceSource, "fonte da referência", 2048) || null);
    const bookingLocator = body.bookingLocator === undefined && existing ? existing.bookingLocator : (asText(body.bookingLocator, "localizador", 100) || null);
    const notes = body.notes === undefined && existing ? existing.notes : (asText(body.notes, "observações", 10000) || null);
    if (cashReferencePrice !== null && !cashReferenceDate) throw new BadRequestException("Informe a data da pesquisa para usar o preço de referência.");
    return { origin, destination, issuanceDate, outboundDate, returnDate, program, cabin, milesUsed, feesPaid, cashReferencePrice, cashReferenceDate, cashReferenceSource, bookingLocator, status: statusRaw as PersonalRedemptionStatus, notes, tripId };
  }

  private async assertOwnedTrip(userId: string, tripId: string) {
    const trip = await this.prisma.personalTrip.findFirst({ where: { id: tripId, userId }, select: { id: true } });
    if (!trip) throw new BadRequestException("A viagem selecionada não existe ou não pertence à sua conta.");
  }

  private async writeAudit(userId: string, redemption: { id: string; origin: string; destination: string; program: string }, action: string, fieldName: string | null, oldValue: unknown, newValue: unknown) {
    await this.prisma.personalRedemptionAudit.create({
      data: {
        redemptionId: redemption.id,
        redemptionLabel: `${redemption.origin}-${redemption.destination} · ${redemption.program}`,
        actorUserId: userId, action, fieldName,
        oldValue: oldValue === null || oldValue === undefined ? null : String(oldValue),
        newValue: newValue === null || newValue === undefined ? null : String(newValue),
      },
    });
  }
}
