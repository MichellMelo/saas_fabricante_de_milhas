import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { PaymentStatus, SubscriptionPeriod } from "@prisma/client";
import { CreateClientPaymentDto } from "./dto/create-client-payment.dto";
import { SetProductAccessDto } from "./dto/set-product-access.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";
import { CreateMileSaleDto } from "./dto/create-mile-sale.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(dto: CreateClientDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ConflictException("Já existe um cliente cadastrado com esse e-mail.");
    return this.prisma.user.create({
      data: {
        email,
        passwordHash: null,
        name: dto.name?.trim() || null,
        phone: dto.phone?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
      select: { id: true, email: true, name: true, phone: true, notes: true, createdAt: true, productAccesses: true },
    });
  }

  async updateClient(id: string, dto: UpdateClientDto) {
    const existing = await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    if (!existing) throw new NotFoundException("Cliente não encontrado.");
    const email = dto.email?.trim().toLowerCase();
    if (email && email !== existing.email) {
      await this.prisma.clientInvitation.updateMany({
        where: { email: existing.email, acceptedAt: null, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date() },
      });
    }
    if (email) {
      const duplicate = await this.prisma.user.findFirst({ where: { email, NOT: { id } }, select: { id: true } });
      if (duplicate) throw new ConflictException("Já existe um cliente cadastrado com esse e-mail.");
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(email ? { email } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
      },
      select: { id: true, email: true, name: true, phone: true, notes: true, createdAt: true },
    });
  }

  async listClients() {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const clients = await this.prisma.user.findMany({
      where: adminEmails.length ? { email: { notIn: adminEmails } } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        notes: true,
        passwordHash: true,
        active: true,
        createdAt: true,
        productAccesses: {
          select: { id: true, product: true, period: true, active: true, startsAt: true, expiresAt: true },
          orderBy: { product: "asc" },
        },
      },
    });
    return clients.map(({ passwordHash, ...client }) => ({ ...client, hasAccount: Boolean(passwordHash) }));
  }

  async setClientStatus(id: string, active: boolean) {
    const client = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!client) throw new NotFoundException("Cliente não encontrado.");
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(client.email.trim().toLowerCase())) {
      throw new BadRequestException("Não é permitido alterar o status de uma conta administrativa por esta tela.");
    }
    if (active && !client.passwordHash) {
      throw new BadRequestException("Esta conta ainda não foi ativada pelo cliente. Envie um convite primeiro.");
    }
    return this.prisma.user.update({
      where: { id },
      data: { active },
      select: { id: true, email: true, active: true },
    });
  }

  async listPayments() {
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    return this.prisma.clientPayment.findMany({
      where: adminEmails.length ? { user: { email: { notIn: adminEmails } } } : undefined,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: {
        id: true, userId: true, product: true, amount: true, dueAt: true, status: true,
        method: true, paidAt: true, notes: true, createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async createPayment(dto: CreateClientPaymentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException("Cliente não encontrado.");
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(user.email.trim().toLowerCase())) {
      throw new BadRequestException("Não é permitido registrar cobranças para uma conta administrativa.");
    }
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException("O valor deve ser maior que zero.");
    const dueAt = new Date(dto.dueAt);
    if (Number.isNaN(dueAt.getTime())) throw new BadRequestException("Informe uma data de vencimento válida.");
    return this.prisma.clientPayment.create({
      data: {
        userId: user.id,
        product: dto.product,
        amount,
        dueAt,
        method: dto.method,
        notes: dto.notes?.trim() || null,
      },
      select: {
        id: true, userId: true, product: true, amount: true, dueAt: true, status: true,
        method: true, paidAt: true, notes: true, createdAt: true,
      },
    });
  }

  async setPaymentPaid(id: string, paid: boolean) {
    const payment = await this.prisma.clientPayment.findUnique({ where: { id }, select: { id: true, user: { select: { email: true } } } });
    if (!payment) throw new NotFoundException("Lançamento financeiro não encontrado.");
    const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (adminEmails.includes(payment.user.email.trim().toLowerCase())) {
      throw new BadRequestException("Não é permitido alterar cobranças de uma conta administrativa.");
    }
    return this.prisma.clientPayment.update({
      where: { id },
      data: { status: paid ? PaymentStatus.PAID : PaymentStatus.PENDING, paidAt: paid ? new Date() : null },
      select: { id: true, status: true, paidAt: true },
    });
  }

  async listMileSales() {
    return this.prisma.mileSale.findMany({
      orderBy: [{ soldAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, buyerName: true, miles: true, acquisitionCpm: true,
        grossAmount: true, fees: true, soldAt: true, status: true, notes: true, createdAt: true,
      },
    });
  }

  async createMileSale(adminUserId: string, dto: CreateMileSaleDto) {
    const soldAt = new Date(dto.soldAt);
    if (Number.isNaN(soldAt.getTime())) throw new BadRequestException("Informe uma data de venda válida.");
    if (dto.fees !== undefined && dto.fees > dto.grossAmount) {
      throw new BadRequestException("As taxas não podem superar o valor bruto da venda.");
    }
    return this.prisma.mileSale.create({
      data: {
        userId: adminUserId,
        buyerName: dto.buyerName?.trim() || null,
        miles: dto.miles,
        acquisitionCpm: dto.acquisitionCpm,
        grossAmount: dto.grossAmount,
        fees: dto.fees ?? 0,
        soldAt,
        status: dto.status ?? "COMPLETED",
        notes: dto.notes?.trim() || null,
      },
      select: {
        id: true, buyerName: true, miles: true, acquisitionCpm: true, grossAmount: true,
        fees: true, soldAt: true, status: true, notes: true, createdAt: true,
      },
    });
  }

  async updateMileSale(id: string, dto: CreateMileSaleDto) {
    const existing = await this.prisma.mileSale.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Venda de milhas não encontrada.");
    const soldAt = new Date(dto.soldAt);
    if (Number.isNaN(soldAt.getTime())) throw new BadRequestException("Informe uma data de venda válida.");
    if (dto.fees !== undefined && dto.fees > dto.grossAmount) {
      throw new BadRequestException("As taxas não podem superar o valor bruto da venda.");
    }
    return this.prisma.mileSale.update({
      where: { id },
      data: {
        buyerName: dto.buyerName?.trim() || null,
        miles: dto.miles,
        acquisitionCpm: dto.acquisitionCpm,
        grossAmount: dto.grossAmount,
        fees: dto.fees ?? 0,
        soldAt,
        status: dto.status ?? "COMPLETED",
        notes: dto.notes?.trim() || null,
      },
      select: {
        id: true, buyerName: true, miles: true, acquisitionCpm: true, grossAmount: true,
        fees: true, soldAt: true, status: true, notes: true, createdAt: true,
      },
    });
  }

  async deleteMileSale(id: string) {
    const existing = await this.prisma.mileSale.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new NotFoundException("Venda de milhas não encontrada.");
    await this.prisma.mileSale.delete({ where: { id } });
    return { id, deleted: true };
  }

  async setMileSaleStatus(id: string, status: "PENDING" | "COMPLETED" | "CANCELLED") {
    const sale = await this.prisma.mileSale.findUnique({ where: { id }, select: { id: true } });
    if (!sale) throw new NotFoundException("Venda de milhas não encontrada.");
    return this.prisma.mileSale.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async listExpiringAccesses() {
    const now = new Date();
    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return this.prisma.userProductAccess.findMany({
      where: {
        active: true,
        startsAt: { lte: now },
        expiresAt: { gt: now, lte: deadline },
      },
      orderBy: { expiresAt: "asc" },
      select: {
        id: true,
        product: true,
        expiresAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listInvitations() {
    return this.prisma.clientInvitation.findMany({
      where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, productTypes: true, expiresAt: true, createdAt: true },
    });
  }

  async cancelInvitation(id: string) {
    const invitation = await this.prisma.clientInvitation.findUnique({ where: { id }, select: { id: true, acceptedAt: true, expiresAt: true } });
    if (!invitation) throw new NotFoundException("Convite não encontrado.");
    if (invitation.acceptedAt) throw new BadRequestException("Este convite já foi aceito e não pode ser cancelado.");
    if (invitation.expiresAt <= new Date()) throw new BadRequestException("Este convite já expirou.");
    await this.prisma.clientInvitation.update({
      where: { id },
      data: { expiresAt: new Date() },
    });
    return { id, cancelled: true };
  }

  async createInvitation(invitedByUserId: string, dto: CreateInvitationDto) {
    const email = dto.email.trim().toLowerCase();
    const products = [...new Set(dto.products ?? [])];

    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
    if (existingUser?.passwordHash) throw new ConflictException("Esse e-mail já possui uma conta ativa. Gerencie os acessos diretamente na ficha do cliente.");

    const now = new Date();
    await this.prisma.clientInvitation.updateMany({
      where: { email, acceptedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.prisma.clientInvitation.create({
      data: {
        email,
        name: dto.name?.trim() || null,
        tokenHash,
        productTypes: products,
        invitedByUserId,
        expiresAt,
      },
      select: { id: true, email: true, name: true, productTypes: true, expiresAt: true, createdAt: true },
    });

    const baseUrl = (process.env.WEB_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return {
      invitation,
      inviteUrl: `${baseUrl}/accept-invite?token=${token}`,
      delivery: "manual",
    };
  }

  async setProductAccess(userId: string, dto: SetProductAccessDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException("Cliente não encontrado.");

    const startsAt = dto.startsAt === undefined ? undefined : new Date(dto.startsAt);
    const expiresAt = dto.expiresAt === undefined
      ? undefined
      : dto.expiresAt
        ? new Date(dto.expiresAt)
        : null;
    const effectiveStart = startsAt ?? new Date();
    if (dto.active && expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException("A data final deve estar no futuro.");
    }
    if (expiresAt && expiresAt <= effectiveStart) {
      throw new BadRequestException("A data final deve ser posterior à data de adesão.");
    }

    return this.prisma.userProductAccess.upsert({
      where: { userId_product: { userId, product: dto.product } },
      create: {
        userId,
        product: dto.product,
        period: dto.period ?? SubscriptionPeriod.MONTHLY,
        active: dto.active,
        startsAt: startsAt ?? new Date(),
        expiresAt: expiresAt ?? null,
      },
      update: {
        active: dto.active,
        ...(dto.period !== undefined ? { period: dto.period } : {}),
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(expiresAt !== undefined ? { expiresAt } : {}),
      },
      select: { id: true, userId: true, product: true, period: true, active: true, startsAt: true, expiresAt: true },
    });
  }
}
