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
    const [purchases, sales, profitSales, inventory, walletAccounts] = await Promise.all([
      this.prisma.milePurchase.aggregate({
        where: { userId, ...(from || to ? { purchasedAt: range } : {}) },
        _sum: { grossAmount: true, fees: true, miles: true },
        _count: { _all: true },
      }),
      this.prisma.mileSale.aggregate({
        where: { userId, status: MileSaleStatus.COMPLETED, ...(from || to ? { soldAt: range } : {}) },
        _sum: { grossAmount: true, fees: true, miles: true },
        _count: { _all: true },
      }),
      this.prisma.mileSale.aggregate({
        where: { userId, inventoryManaged: true, status: MileSaleStatus.COMPLETED, ...(from || to ? { soldAt: range } : {}) },
        _sum: { grossAmount: true, fees: true, costOfGoodsSold: true },
      }),
      this.prisma.mileInventory.findMany({
        where: { userId },
        include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
        orderBy: { loyaltyProgram: { name: "asc" } },
      }),
      this.prisma.loyaltyAccount.findMany({
        where: { userId },
        select: { loyaltyProgramId: true, balance: true },
      }),
    ]);
    const revenue = new Prisma.Decimal(sales._sum.grossAmount ?? 0);
    const saleFees = new Prisma.Decimal(sales._sum.fees ?? 0);
    const knownCostRevenue = new Prisma.Decimal(profitSales._sum.grossAmount ?? 0);
    const knownCostFees = new Prisma.Decimal(profitSales._sum.fees ?? 0);
    const cogs = new Prisma.Decimal(profitSales._sum.costOfGoodsSold ?? 0);
    return {
      period: { from: from ?? null, to: to ?? null },
      purchases: { count: purchases._count._all, grossAmount: purchases._sum.grossAmount ?? new Prisma.Decimal(0), fees: purchases._sum.fees ?? new Prisma.Decimal(0), miles: purchases._sum.miles ?? 0 },
      sales: { count: sales._count._all, grossAmount: revenue, fees: saleFees, miles: sales._sum.miles ?? 0 },
      estimatedProfit: knownCostRevenue.minus(knownCostFees).minus(cogs).toDecimalPlaces(2),
      hasSalesWithUnknownCost: sales._count._all > (await this.prisma.mileSale.count({ where: { userId, inventoryManaged: true, status: MileSaleStatus.COMPLETED, ...(from || to ? { soldAt: range } : {}) } })),
      inventory: inventory.map((item) => ({
        id: item.id, loyaltyProgram: item.loyaltyProgram, miles: item.miles,
        totalCost: item.totalCost, averageCpm: item.averageCpm, updatedAt: item.updatedAt,
      })),
      inventoryTotalCost: inventory.reduce((sum, item) => sum.plus(item.totalCost), new Prisma.Decimal(0)),
      inventoryMiles: inventory.reduce((sum, item) => sum + item.miles, 0),
      walletBalances: walletAccounts.map((account) => ({ loyaltyProgramId: account.loyaltyProgramId, miles: Number(account.balance) })),
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
      where: { userId, ...(from || to ? { soldAt } : {}) },
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

      // If this user already tracks the same loyalty program in their wallet,
      // keep its points balance and transaction history in sync with the purchase.
      const loyaltyAccount = await tx.loyaltyAccount.findUnique({
        where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } },
        select: { id: true },
      });
      if (loyaltyAccount) {
        await tx.loyaltyAccount.update({
          where: { id: loyaltyAccount.id },
          data: { balance: { increment: miles }, lastBalanceAt: purchasedAt },
        });
        await tx.pointTransaction.create({
          data: {
            userId,
            loyaltyAccountId: loyaltyAccount.id,
            type: "PURCHASE",
            points: new Prisma.Decimal(miles),
            unitCostBrl: totalCost.div(miles).toDecimalPlaces(4),
            cashValueBrl: totalCost,
            occurredAt: purchasedAt,
            notes: `Compra integrada ao Financeiro de Milhas.${dto.notes?.trim() ? ` ${dto.notes.trim()}` : ""}`,
          },
        });
      }
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

      // Manually reported wallet balances may have no acquisition cost/inventory record.
      // Permit a wallet-only sale when no finance-managed stock exists, without inventing a cost.
      if (!inventory || inventory.miles === 0) {
        const account = await tx.loyaltyAccount.findUnique({
          where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } },
        });
        if (!account || new Prisma.Decimal(account.balance).lt(dto.miles)) {
          throw new BadRequestException("Saldo insuficiente em Programas e saldos para esse programa.");
        }
        const sale = await tx.mileSale.create({
          data: {
            userId, loyaltyProgramId: program.id, buyerName: dto.buyerName?.trim() || null,
            miles: dto.miles, acquisitionCpm: new Prisma.Decimal(0), costOfGoodsSold: null,
            grossAmount: gross, fees, soldAt, status: MileSaleStatus.COMPLETED,
            notes: [ "Custo de aquisição desconhecido; venda de saldo informado manualmente.", dto.notes?.trim() ].filter(Boolean).join(" "),
            inventoryManaged: false,
          },
        });
        await tx.loyaltyAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: new Prisma.Decimal(dto.miles) }, lastBalanceAt: soldAt },
        });
        await tx.pointTransaction.create({
          data: {
            userId, loyaltyAccountId: account.id, type: "ADJUSTMENT",
            points: new Prisma.Decimal(dto.miles).negated(), occurredAt: soldAt,
            notes: `Venda de saldo sem custo conhecido integrada ao Financeiro de Milhas.${dto.buyerName?.trim() ? ` Comprador: ${dto.buyerName.trim()}.` : ""}`,
          },
        });
        return sale;
      }
      if (inventory.miles < dto.miles) throw new BadRequestException("O estoque financeiro é insuficiente. O saldo informado manualmente pode ser vendido quando não houver estoque financeiro registrado.");
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

      // Keep the points wallet synchronized with the financial sale when the
      // user has a matching loyalty account. Reject rather than create a negative balance.
      const loyaltyAccount = await tx.loyaltyAccount.findUnique({
        where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } },
      });
      if (loyaltyAccount) {
        const walletBalance = new Prisma.Decimal(loyaltyAccount.balance);
        const soldPoints = new Prisma.Decimal(dto.miles);
        if (walletBalance.lt(soldPoints)) {
          throw new BadRequestException("Saldo insuficiente em Programas e saldos para registrar essa venda.");
        }
        await tx.loyaltyAccount.update({
          where: { id: loyaltyAccount.id },
          data: { balance: { decrement: soldPoints }, lastBalanceAt: soldAt },
        });
        await tx.pointTransaction.create({
          data: {
            userId,
            loyaltyAccountId: loyaltyAccount.id,
            type: "ADJUSTMENT",
            points: soldPoints.negated(),
            occurredAt: soldAt,
            notes: `Venda integrada ao Financeiro de Milhas.${dto.buyerName?.trim() ? ` Comprador: ${dto.buyerName.trim()}.` : ""}`,
          },
        });
      }
      return sale;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async updatePurchase(userId: string, id: string, dto: CreateMilePurchaseDto) {
    const purchasedAt = this.validDate(dto.purchasedAt, "compra");
    const gross = new Prisma.Decimal(dto.grossAmount);
    const fees = new Prisma.Decimal(dto.fees ?? 0);
    if (fees.gt(gross)) throw new BadRequestException("As taxas não podem superar o valor bruto da compra.");
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.milePurchase.findFirst({ where: { id, userId } });
      if (!purchase) throw new NotFoundException("Compra não encontrada.");
      if (purchase.miles !== dto.miles || purchase.loyaltyProgramId !== dto.loyaltyProgramId) {
        throw new BadRequestException("Para preservar o custo médio, edição de compra permite alterar valor, taxas, data e observações, mas não programa ou quantidade. Exclua e registre novamente se precisar mudar esses dados.");
      }
      const laterMovement = await tx.mileInventoryMovement.findFirst({ where: { userId, loyaltyProgramId: purchase.loyaltyProgramId, occurredAt: { gt: purchase.purchasedAt } } });
      if (laterMovement) throw new BadRequestException("Esta compra possui movimentações posteriores. Não pode ser editada sem reconstruir o histórico do estoque.");
      const oldTotal = purchase.grossAmount.plus(purchase.fees);
      const newTotal = gross.plus(fees).toDecimalPlaces(2);
      const delta = newTotal.minus(oldTotal);
      const inventory = await tx.mileInventory.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: purchase.loyaltyProgramId } } });
      if (!inventory) throw new BadRequestException("Estoque da compra não encontrado.");
      const totalCost = inventory.totalCost.plus(delta).toDecimalPlaces(2);
      if (totalCost.lt(0)) throw new BadRequestException("A edição deixaria o custo do estoque negativo.");
      const averageCpm = inventory.miles === 0 ? new Prisma.Decimal(0) : totalCost.div(inventory.miles).mul(1000).toDecimalPlaces(4);
      await tx.mileInventory.update({ where: { id: inventory.id }, data: { totalCost, averageCpm } });
      const updated = await tx.milePurchase.update({ where: { id }, data: { grossAmount: gross, fees, purchasedAt, notes: dto.notes?.trim() || null, acquisitionCpm: newTotal.div(purchase.miles).mul(1000).toDecimalPlaces(4) } });
      await tx.mileInventoryMovement.updateMany({ where: { purchaseId: id }, data: { occurredAt: purchasedAt, totalCost: newTotal, unitCostCpm: newTotal.div(purchase.miles).mul(1000).toDecimalPlaces(4) } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async deletePurchase(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.milePurchase.findFirst({ where: { id, userId } });
      if (!purchase) throw new NotFoundException("Compra não encontrada.");
      const laterMovement = await tx.mileInventoryMovement.findFirst({ where: { userId, loyaltyProgramId: purchase.loyaltyProgramId, occurredAt: { gt: purchase.purchasedAt } } });
      if (laterMovement) throw new BadRequestException("Esta compra possui movimentações posteriores. Exclua ou ajuste as operações mais recentes primeiro.");
      const inventory = await tx.mileInventory.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: purchase.loyaltyProgramId } } });
      if (!inventory || inventory.miles < purchase.miles) throw new BadRequestException("Não é possível excluir: o estoque atual não comporta a reversão desta compra.");
      const totalCost = inventory.totalCost.minus(purchase.grossAmount).minus(purchase.fees).toDecimalPlaces(2);
      const miles = inventory.miles - purchase.miles;
      if (totalCost.lt(0)) throw new BadRequestException("Não é possível excluir: o custo do estoque ficaria negativo.");
      await tx.mileInventory.update({ where: { id: inventory.id }, data: { miles, totalCost: miles === 0 ? 0 : totalCost, averageCpm: miles === 0 ? 0 : totalCost.div(miles).mul(1000).toDecimalPlaces(4) } });
      const account = await tx.loyaltyAccount.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: purchase.loyaltyProgramId } } });
      if (account) {
        const balance = new Prisma.Decimal(account.balance);
        if (balance.lt(purchase.miles)) throw new BadRequestException("Não é possível reverter a compra: saldo atual da carteira insuficiente.");
        await tx.loyaltyAccount.update({ where: { id: account.id }, data: { balance: { decrement: purchase.miles }, lastBalanceAt: new Date() } });
        await tx.pointTransaction.create({ data: { userId, loyaltyAccountId: account.id, type: "ADJUSTMENT", points: new Prisma.Decimal(-purchase.miles), occurredAt: new Date(), notes: "Estorno auditável de compra excluída do Financeiro de Milhas." } });
      }
      await tx.mileInventoryMovement.updateMany({ where: { purchaseId: id }, data: { purchaseId: null, reason: "Compra excluída; movimento original preservado para auditoria." } });
      await tx.milePurchase.delete({ where: { id } });
      return { success: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async updateSale(userId: string, id: string, dto: CreatePersonalMileSaleDto) {
    const soldAt = this.validDate(dto.soldAt, "venda");
    const gross = new Prisma.Decimal(dto.grossAmount);
    const fees = new Prisma.Decimal(dto.fees ?? 0);
    if (fees.gt(gross)) throw new BadRequestException("As taxas não podem superar o valor bruto da venda.");
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.mileSale.findFirst({ where: { id, userId } });
      if (!sale) throw new NotFoundException("Venda não encontrada.");
      if (sale.miles !== dto.miles || sale.loyaltyProgramId !== dto.loyaltyProgramId) throw new BadRequestException("Para preservar estoque e custo médio, edição de venda permite alterar valor, taxas, comprador, data e observações, mas não programa ou quantidade.");
      const laterMovement = sale.inventoryManaged ? await tx.mileInventoryMovement.findFirst({ where: { userId, loyaltyProgramId: sale.loyaltyProgramId!, occurredAt: { gt: sale.soldAt }, saleId: { not: id } } }) : null;
      if (laterMovement) throw new BadRequestException("Esta venda possui movimentações posteriores. Não pode ser editada sem reconstruir o histórico do estoque.");
      const updated = await tx.mileSale.update({ where: { id }, data: { grossAmount: gross, fees, soldAt, buyerName: dto.buyerName?.trim() || null, notes: dto.notes?.trim() || null } });
      await tx.mileInventoryMovement.updateMany({ where: { saleId: id }, data: { occurredAt: soldAt } });
      await tx.pointTransaction.updateMany({ where: { userId, notes: { contains: id } }, data: { occurredAt: soldAt } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async deleteSale(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.mileSale.findFirst({ where: { id, userId } });
      if (!sale) throw new NotFoundException("Venda não encontrada.");
      if (sale.inventoryManaged && sale.loyaltyProgramId) {
        const laterMovement = await tx.mileInventoryMovement.findFirst({ where: { userId, loyaltyProgramId: sale.loyaltyProgramId, occurredAt: { gt: sale.soldAt }, saleId: { not: id } } });
        if (laterMovement) throw new BadRequestException("Esta venda possui movimentações posteriores. Exclua ou ajuste as operações mais recentes primeiro.");
        const inventory = await tx.mileInventory.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: sale.loyaltyProgramId } } });
        if (!inventory) throw new BadRequestException("Estoque não encontrado para reverter esta venda.");
        const restoredMiles = inventory.miles + sale.miles;
        const restoredCost = inventory.totalCost.plus(sale.costOfGoodsSold ?? 0).toDecimalPlaces(2);
        await tx.mileInventory.update({ where: { id: inventory.id }, data: { miles: restoredMiles, totalCost: restoredCost, averageCpm: restoredCost.div(restoredMiles).mul(1000).toDecimalPlaces(4) } });
      }
      if (sale.loyaltyProgramId) {
        const account = await tx.loyaltyAccount.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: sale.loyaltyProgramId } } });
        if (account) {
          await tx.loyaltyAccount.update({ where: { id: account.id }, data: { balance: { increment: sale.miles }, lastBalanceAt: new Date() } });
          await tx.pointTransaction.create({ data: { userId, loyaltyAccountId: account.id, type: "ADJUSTMENT", points: new Prisma.Decimal(sale.miles), occurredAt: new Date(), notes: "Estorno auditável de venda excluída do Financeiro de Milhas." } });
        }
      }
      await tx.mileInventoryMovement.updateMany({ where: { saleId: id }, data: { saleId: null, reason: "Venda excluída; movimento original preservado para auditoria." } });
      await tx.mileSale.delete({ where: { id } });
      return { success: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async createAdjustment(userId: string, dto: CreateInventoryAdjustmentDto) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: dto.loyaltyProgramId, active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      select: { id: true },
    });
    if (!program) throw new NotFoundException("Programa de fidelidade não encontrado ou inativo.");
    if (dto.direction === "IN" && dto.unitCostCpm === undefined) throw new BadRequestException("Informe o custo por milheiro para uma entrada manual.");
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.mileInventory.findUnique({ where: { userId_loyaltyProgramId: { userId, loyaltyProgramId: program.id } } });
      if (dto.direction === "OUT" && (!inventory || inventory.miles < dto.miles)) throw new BadRequestException("Saldo insuficiente para esse ajuste.");
      if (dto.direction === "IN") {
        const unitCost = new Prisma.Decimal(dto.unitCostCpm ?? 0);
        const addedCost = unitCost.mul(dto.miles).div(1000).toDecimalPlaces(2);
        if (!inventory) {
          await tx.mileInventory.create({ data: { userId, loyaltyProgramId: program.id, miles: dto.miles, totalCost: addedCost, averageCpm: unitCost } });
        } else {
          const nextMiles = inventory.miles + dto.miles;
          const nextCost = inventory.totalCost.plus(addedCost).toDecimalPlaces(2);
          await tx.mileInventory.update({ where: { id: inventory.id }, data: { miles: nextMiles, totalCost: nextCost, averageCpm: nextCost.div(nextMiles).mul(1000).toDecimalPlaces(4) } });
        }
        return tx.mileInventoryMovement.create({ data: { userId, loyaltyProgramId: program.id, type: MileInventoryMovementType.ADJUSTMENT_IN, miles: dto.miles, unitCostCpm: unitCost, totalCost: addedCost, reason: dto.reason } });
      }
      const current = inventory!;
      const removedCost = current.totalCost.mul(dto.miles).div(current.miles).toDecimalPlaces(2);
      const nextMiles = current.miles - dto.miles;
      const nextCost = current.totalCost.minus(removedCost).toDecimalPlaces(2);
      await tx.mileInventory.update({ where: { id: current.id }, data: { miles: nextMiles, totalCost: nextMiles === 0 ? 0 : nextCost, averageCpm: nextMiles === 0 ? 0 : nextCost.div(nextMiles).mul(1000).toDecimalPlaces(4) } });
      return tx.mileInventoryMovement.create({ data: { userId, loyaltyProgramId: program.id, type: MileInventoryMovementType.ADJUSTMENT_OUT, miles: -dto.miles, unitCostCpm: current.averageCpm, totalCost: removedCost, reason: dto.reason } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
