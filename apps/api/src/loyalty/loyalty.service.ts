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

  listPrograms() {
    return this.prisma.loyaltyProgram.findMany({
      where: { active: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, code: true, type: true },
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
      where: { id: dto.loyaltyProgramId, active: true },
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
