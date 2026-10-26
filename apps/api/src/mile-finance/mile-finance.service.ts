import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { MileInventoryMovementType, MileSaleStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMilePurchaseDto } from "./dto/create-mile-purchase.dto";
import { CreatePersonalMileSaleDto } from "./dto/create-mile-sale.dto";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";

@Injectable()
export class MileFinanceService {
  constructor(private readonly prisma: PrismaService) {}

  private validDate(value: string, label: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`Informe uma data válida para ${label}.`);
    return date;
  }

  async dashboard(userId: string, from?: string, to?: string) {
    const range: Prisma.DateTimeFilter = {};
    if (from) range.gte = this.validDate(from, "início do período");
    if (to) range.lte = this.validDate(to, "fim do período");
    const [purchases, sales, inventory] = await Promise.all([
      this.prisma.milePurchase.aggregate({
        where: { userId, ...(from || to ? { purchasedAt: range } : {}) },
        _sum: { grossAmount: true, fees: true, miles: true },
        _count: { _all: true },
      }),
      this.prisma.mileSale.aggregate({
        where: { userId, inventoryManaged: true, status: MileSaleStatus.COMPLETED, ...(from || to ? { soldAt: range } : {}) },
        _sum: { grossAmount: true, fees: true, costOfGoodsSold: true, miles: true },
        _count: { _all: true },
      }),
      this.prisma.mileInventory.findMany({
        where: { userId },
        include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
        orderBy: { loyaltyProgram: { name: "asc" } },
      }),
    ]);
    const revenue = new Prisma.Decimal(sales._sum.grossAmount ?? 0);
    const saleFees = new Prisma.Decimal(sales._sum.fees ?? 0);
    const cogs = new Prisma.Decimal(sales._sum.costOfGoodsSold ?? 0);
    return {
      period: { from: from ?? null, to: to ?? null },
      purchases: { count: purchases._count._all, grossAmount: purchases._sum.grossAmount ?? new Prisma.Decimal(0), fees: purchases._sum.fees ?? new Prisma.Decimal(0), miles: purchases._sum.miles ?? 0 },
      sales: { count: sales._count._all, grossAmount: revenue, fees: saleFees, miles: sales._sum.miles ?? 0 },
      estimatedProfit: revenue.minus(saleFees).minus(cogs).toDecimalPlaces(2),
      inventory: inventory.map((item) => ({
        id: item.id, loyaltyProgram: item.loyaltyProgram, miles: item.miles,
        totalCost: item.totalCost, averageCpm: item.averageCpm, updatedAt: item.updatedAt,
      })),
      inventoryTotalCost: inventory.reduce((sum, item) => sum.plus(item.totalCost), new Prisma.Decimal(0)),
      inventoryMiles: inventory.reduce((sum, item) => sum + item.miles, 0),
    };
  }

  listInventory(userId: string) {
    return this.prisma.mileInventory.findMany({
      where: { userId },
      include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
      orderBy: { loyaltyProgram: { name: "asc" } },
    });
  }

  listPurchases(userId: string, from?: string, to?: string) {
    const purchasedAt: Prisma.DateTimeFilter = {};
    if (from) purchasedAt.gte = this.validDate(from, "início do período");
    if (to) purchasedAt.lte = this.validDate(to, "fim do período");
    return this.prisma.milePurchase.findMany({
      where: { userId, ...(from || to ? { purchasedAt } : {}) },
      include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
      orderBy: [{ purchasedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  listSales(userId: string, from?: string, to?: string) {
    const soldAt: Prisma.DateTimeFilter = {};
    if (from) soldAt.gte = this.validDate(from, "início do período");
    if (to) soldAt.lte = this.validDate(to, "fim do período");
    return this.prisma.mileSale.findMany({
      where: { userId, inventoryManaged: true, ...(from || to ? { soldAt } : {}) },
      include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
      orderBy: [{ soldAt: "desc" }, { createdAt: "desc" }],
    });
  }

  listMovements(userId: string, from?: string, to?: string) {
    const occurredAt: Prisma.DateTimeFilter = {};
    if (from) occurredAt.gte = this.validDate(from, "início do período");
    if (to) occurredAt.lte = this.validDate(to, "fim do período");
    return this.prisma.mileInventoryMovement.findMany({
      where: { userId, ...(from || to ? { occurredAt } : {}) },
      include: {
        loyaltyProgram: { select: { id: true, name: true, code: true, type: true } },
        purchase: { select: { id: true, purchasedAt: true } },
        sale: { select: { id: true, soldAt: true, buyerName: true } },
      },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    });
  }

  async createPurchase(userId: string, dto: CreateMilePurchaseDto) {
    const purchasedAt = this.validDate(dto.purchasedAt, "compra");
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: dto.loyaltyProgramId, active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      select: { id: true },
    });
    if (!program) throw new NotFoundException("Programa de fidelidade não encontrado ou inativo.");
    const miles = dto.miles;
    const gross = new Prisma.Decimal(dto.grossAmount);
    const fees = new Prisma.Decimal(dto.fees ?? 0);
    const totalCost = gross.plus(fees).toDecimalPlaces(2);
    if (fees.gt(gross)) throw new BadRequestException("As taxas não podem superar o valor bruto da compra.");
    const purchaseCpm = totalCost.div(miles).mul(1000).toDecimalPlaces(4);
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.milePurchase.create({
        data: { userId, loyaltyProgramId: program.id, miles, acquisitionCpm: purchaseCpm, grossAmount: gross, fees, purchasedAt, notes: dto.notes?.trim() || null },
      });
      const inventory = await tx.mileInventory.findUnique({
        where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } },
      });
      if (!inventory) {
        await tx.mileInventory.create({
          data: { userId, loyaltyProgramId: program.id, miles, totalCost, averageCpm: purchaseCpm },
        });
      } else {
        const newMiles = inventory.miles + miles;
        const newTotal = inventory.totalCost.plus(totalCost).toDecimalPlaces(2);
        await tx.mileInventory.update({
          where: { id: inventory.id },
          data: { miles: newMiles, totalCost: newTotal, averageCpm: newTotal.div(newMiles).mul(1000).toDecimalPlaces(4) },
        });
      }
      await tx.mileInventoryMovement.create({
        data: { userId, loyaltyProgramId: program.id, type: MileInventoryMovementType.PURCHASE, miles, unitCostCpm: purchaseCpm, totalCost, purchaseId: purchase.id, occurredAt: purchasedAt },
      });
      return purchase;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createSale(userId: string, dto: CreatePersonalMileSaleDto) {
    const soldAt = this.validDate(dto.soldAt, "venda");
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: dto.loyaltyProgramId, active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      select: { id: true },
    });
    if (!program) throw new NotFoundException("Programa de fidelidade não encontrado ou inativo.");
    const gross = new Prisma.Decimal(dto.grossAmount);
    const fees = new Prisma.Decimal(dto.fees ?? 0);
    if (fees.gt(gross)) throw new BadRequestException("As taxas não podem superar o valor bruto da venda.");
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.mileInventory.findUnique({
        where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } },
      });
      if (!inventory || inventory.miles < dto.miles) throw new BadRequestException("Saldo de milhas insuficiente para esse programa.");
      const costOfGoodsSold = inventory.totalCost.mul(dto.miles).div(inventory.miles).toDecimalPlaces(2);
      const acquisitionCpm = costOfGoodsSold.div(dto.miles).mul(1000).toDecimalPlaces(4);
      const updated = await tx.mileInventory.updateMany({
        where: { id: inventory.id, userId, miles: { gte: dto.miles } },
        data: {
          miles: { decrement: dto.miles },
          totalCost: { decrement: costOfGoodsSold },
        },
      });
      if (updated.count !== 1) throw new BadRequestException("Saldo de milhas insuficiente para esse programa.");
      const newInventory = await tx.mileInventory.findUniqueOrThrow({ where: { id: inventory.id } });
      const totalCost = newInventory.miles === 0 ? new Prisma.Decimal(0) : newInventory.totalCost;
      await tx.mileInventory.update({
        where: { id: inventory.id },
        data: { totalCost, averageCpm: newInventory.miles === 0 ? new Prisma.Decimal(0) : totalCost.div(newInventory.miles).mul(1000).toDecimalPlaces(4) },
      });
      const sale = await tx.mileSale.create({
        data: {
          userId, loyaltyProgramId: program.id, buyerName: dto.buyerName?.trim() || null,
          miles: dto.miles, acquisitionCpm, costOfGoodsSold, grossAmount: gross, fees,
          soldAt, status: MileSaleStatus.COMPLETED, notes: dto.notes?.trim() || null, inventoryManaged: true,
        },
      });
      await tx.mileInventoryMovement.create({
        data: { userId, loyaltyProgramId: program.id, type: MileInventoryMovementType.SALE, miles: -dto.miles, unitCostCpm: acquisitionCpm, totalCost: costOfGoodsSold, saleId: sale.id, occurredAt: soldAt },
      });
      return sale;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createAdjustment(userId: string, dto: CreateInventoryAdjustmentDto) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: dto.loyaltyProgramId, active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      select: { id: true },
    });
    if (!program) throw new NotFoundException("Programa de fidelidade não encontrado ou inativo.");
    if (dto.direction === "IN") throw new BadRequestException("Entrada manual exige custo de aquisição e será habilitada com a validação de custo.");
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.mileInventory.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } } });
      if (!inventory || inventory.miles < dto.miles) throw new BadRequestException("Saldo insuficiente para esse ajuste.");
      const removedCost = inventory.totalCost.mul(dto.miles).div(inventory.miles).toDecimalPlaces(2);
      await tx.mileInventory.update({ where: { id: inventory.id }, data: { miles: { decrement: dto.miles }, totalCost: { decrement: removedCost }, averageCpm: inventory.miles === dto.miles ? 0 : inventory.totalCost.minus(removedCost).div(inventory.miles - dto.miles).mul(1000).toDecimalPlaces(4) } });
      return tx.mileInventoryMovement.create({ data: { userId, loyaltyProgramId: program.id, type: MileInventoryMovementType.ADJUSTMENT_OUT, miles: -dto.miles, unitCostCpm: inventory.averageCpm, totalCost: removedCost, reason: dto.reason } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
