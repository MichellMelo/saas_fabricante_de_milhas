import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import { Prisma, ProductType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvitationDto } from "./dto/create-invitation.dto";
import { SetProductAccessDto } from "./dto/set-product-access.dto";

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async listClients() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        productAccesses: {
          select: { id: true, product: true, active: true, startsAt: true, expiresAt: true },
          orderBy: { product: "asc" },
        },
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

  async createInvitation(invitedByUserId: string, dto: CreateInvitationDto) {
    const email = dto.email.trim().toLowerCase();
    const products = [...new Set(dto.products)];
    if (!products.length) throw new BadRequestException("Selecione pelo menos um produto para o cliente.");

    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) throw new ConflictException("Já existe um usuário com esse e-mail. Conceda ou atualize os acessos na lista de clientes.");

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

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (dto.active && expiresAt && expiresAt <= new Date()) {
      throw new BadRequestException("A data de expiração deve estar no futuro.");
    }

    return this.prisma.userProductAccess.upsert({
      where: { userId_product: { userId, product: dto.product } },
      create: {
        userId,
        product: dto.product,
        active: dto.active,
        startsAt: new Date(),
        expiresAt,
      },
      update: {
        active: dto.active,
        expiresAt,
      },
      select: { id: true, userId: true, product: true, active: true, startsAt: true, expiresAt: true },
    });
  }
}
