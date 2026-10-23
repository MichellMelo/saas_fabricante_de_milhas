import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { SubscriptionPeriod } from "@prisma/client";
import { SetProductAccessDto } from "./dto/set-product-access.dto";
import { CreateClientDto } from "./dto/create-client.dto";
import { UpdateClientDto } from "./dto/update-client.dto";

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
    const products = [...new Set(dto.products)];
    if (!products.length) throw new BadRequestException("Selecione pelo menos um produto para o cliente.");

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
