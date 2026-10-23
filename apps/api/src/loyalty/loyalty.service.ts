import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TransactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";

const DEBIT_TYPES = new Set<TransactionType>([
  TransactionType.TRANSFER_OUT,
  TransactionType.REDEMPTION,
  TransactionType.EXPIRATION,
]);

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  listPrograms(userId: string) {
    return this.prisma.loyaltyProgram.findMany({
      where: { active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, type: true },
    });
  }

  listProgramsForManagement(userId: string, canManageCatalog: boolean) {
    return this.prisma.loyaltyProgram.findMany({
      where: canManageCatalog
        ? { OR: [{ ownerUserId: null }, { ownerUserId: userId }] }
        : { OR: [{ ownerUserId: null, active: true }, { ownerUserId: userId }] },
      orderBy: [{ ownerUserId: "asc" }, { type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, type: true, active: true, ownerUserId: true },
    });
  }

  async createPersonalProgram(userId: string, name: string, type: import("@prisma/client").LoyaltyProgramType) {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new BadRequestException("O nome do programa deve ter entre 2 e 80 caracteres.");
    }
    const slug = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 32) || "PROGRAM";
    return this.prisma.loyaltyProgram.create({
      data: {
        name: normalizedName,
        code: `CUSTOM_${slug}_${userId.slice(-8)}_${Date.now().toString(36).toUpperCase()}`,
        type,
        ownerUserId: userId,
        active: true,
      },
      select: { id: true, name: true, code: true, type: true, active: true, ownerUserId: true },
    });
  }

  async createCatalogProgram(name: string, type: import("@prisma/client").LoyaltyProgramType) {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new BadRequestException("O nome do programa deve ter entre 2 e 80 caracteres.");
    }
    const code = normalizedName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 48);
    if (!code) throw new BadRequestException("Informe um nome válido para o programa.");
    try {
      return await this.prisma.loyaltyProgram.create({
        data: { name: normalizedName, code, type, ownerUserId: null, active: true },
        select: { id: true, name: true, code: true, type: true, active: true, ownerUserId: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Já existe um programa no catálogo com esse código. Edite o existente ou escolha outro nome.");
      }
      throw error;
    }
  }

  async updateCatalogProgram(id: string, name: string, type: import("@prisma/client").LoyaltyProgramType) {
    const program = await this.prisma.loyaltyProgram.findFirst({ where: { id, ownerUserId: null }, select: { id: true } });
    if (!program) throw new NotFoundException("Programa do catálogo não encontrado.");
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      throw new BadRequestException("O nome do programa deve ter entre 2 e 80 caracteres.");
    }
    return this.prisma.loyaltyProgram.update({
      where: { id },
      data: { name: normalizedName, type },
      select: { id: true, name: true, code: true, type: true, active: true, ownerUserId: true },
    });
  }

  async setCatalogProgramActive(id: string, active: boolean) {
    const program = await this.prisma.loyaltyProgram.findFirst({ where: { id, ownerUserId: null }, select: { id: true } });
    if (!program) throw new NotFoundException("Programa do catálogo não encontrado.");
    return this.prisma.loyaltyProgram.update({
      where: { id },
      data: { active },
      select: { id: true, name: true, code: true, type: true, active: true, ownerUserId: true },
    });
  }

  listAccounts(userId: string) {
    return this.prisma.loyaltyAccount.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        loyaltyProgram: { select: { id: true, name: true, code: true, type: true } },
        _count: { select: { transactions: true } },
      },
    });
  }

  async createAccount(userId: string, dto: CreateAccountDto) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id: dto.loyaltyProgramId, active: true, OR: [{ ownerUserId: null }, { ownerUserId: userId }] },
      select: { id: true },
    });
    if (!program) throw new NotFoundException("Programa de fidelidade não encontrado ou inativo.");

    const initialBalance = new Prisma.Decimal(dto.initialBalance ?? 0);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const account = await tx.loyaltyAccount.create({
          data: {
            userId,
            loyaltyProgramId: dto.loyaltyProgramId,
            memberReference: dto.memberReference?.trim() || null,
            balance: initialBalance,
            lastBalanceAt: initialBalance.gt(0) ? new Date() : null,
          },
          include: { loyaltyProgram: { select: { id: true, name: true, code: true, type: true } } },
        });
        if (initialBalance.gt(0)) {
          await tx.pointTransaction.create({
            data: {
              userId,
              loyaltyAccountId: account.id,
              type: TransactionType.ADJUSTMENT,
              points: initialBalance,
              occurredAt: new Date(),
              notes: "Saldo inicial informado no cadastro da conta",
            },
          });
        }
        return account;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Você já possui uma conta cadastrada para esse programa.");
      }
      throw error;
    }
  }

  async createTransaction(userId: string, accountId: string, dto: CreateTransactionDto) {
    const inputPoints = new Prisma.Decimal(dto.points);
    if (dto.type !== TransactionType.ADJUSTMENT && inputPoints.lte(0)) {
      throw new BadRequestException("Informe uma quantidade positiva de pontos.");
    }
    if (inputPoints.isZero()) {
      throw new BadRequestException("A movimentação precisa ter uma quantidade diferente de zero.");
    }

    const delta = DEBIT_TYPES.has(dto.type)
      ? inputPoints.abs().negated()
      : inputPoints;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.loyaltyAccount.findFirst({
        where: { id: accountId, userId },
        select: { id: true },
      });
      if (!account) throw new NotFoundException("Conta de fidelidade não encontrada.");

      // Conditional atomic update prevents concurrent debits from overspending
      // and avoids lost balance updates when two transactions arrive together.
      const updated = delta.lt(0)
        ? await tx.loyaltyAccount.updateMany({
            where: { id: account.id, userId, balance: { gte: delta.abs() } },
            data: { balance: { decrement: delta.abs() }, lastBalanceAt: occurredAt },
          })
        : await tx.loyaltyAccount.updateMany({
            where: { id: account.id, userId },
            data: { balance: { increment: delta }, lastBalanceAt: occurredAt },
          });

      if (updated.count !== 1) {
        throw new BadRequestException("Saldo insuficiente para essa movimentação.");
      }

      const transaction = await tx.pointTransaction.create({
        data: {
          userId,
          loyaltyAccountId: account.id,
          type: dto.type,
          points: delta,
          unitCostBrl: dto.unitCostBrl,
          cashValueBrl: dto.cashValueBrl,
          occurredAt,
          notes: dto.notes?.trim() || null,
        },
      });
      const updatedAccount = await tx.loyaltyAccount.findUniqueOrThrow({
        where: { id: account.id },
        select: { balance: true },
      });
      return { transaction, balance: updatedAccount.balance };
    });
  }
}
