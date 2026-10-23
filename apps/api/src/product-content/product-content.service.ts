import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupVipPostDto } from "../group-vip/dto/create-group-vip-post.dto";
import { UpdateGroupVipPostDto } from "../group-vip/dto/update-group-vip-post.dto";

@Injectable()
export class ProductContentService {
  constructor(private readonly prisma: PrismaService) {}

  async assertProductAccess(userId: string, product: ProductType) {
    const now = new Date();
    const access = await this.prisma.userProductAccess.findFirst({
      where: {
        userId,
        product,
        active: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    if (!access) {
      const label = product === ProductType.AULAO ? "Aulões" : "Mentorias";
      throw new ForbiddenException(`Seu acesso a ${label} não está ativo. Entre em contato com a equipe.`);
    }
  }

  listContent(product: ProductType, isAdmin: boolean) {
    return this.prisma.productContent.findMany({
      where: {
        product,
        ...(isAdmin ? {} : { isPublished: true, publishedAt: { lte: new Date() } }),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true, product: true, title: true, summary: true, body: true,
        externalUrl: true, isPublished: true, publishedAt: true,
        createdAt: true, updatedAt: true, author: { select: { name: true } },
      },
    });
  }

  createContent(authorId: string, product: ProductType, dto: CreateGroupVipPostDto) {
    return this.prisma.productContent.create({
      data: {
        product,
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        body: dto.body.trim(),
        externalUrl: dto.externalUrl?.trim() || null,
        isPublished: false,
        authorId,
      },
      select: {
        id: true, product: true, title: true, summary: true, body: true,
        externalUrl: true, isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async updateContent(id: string, product: ProductType, dto: UpdateGroupVipPostDto) {
    await this.assertContentExists(id, product);
    return this.prisma.productContent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary?.trim() || null } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl?.trim() || null } : {}),
      },
      select: {
        id: true, product: true, title: true, summary: true, body: true,
        externalUrl: true, isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async setPublished(id: string, product: ProductType, published: boolean) {
    await this.assertContentExists(id, product);
    return this.prisma.productContent.update({
      where: { id },
      data: { isPublished: published, publishedAt: published ? new Date() : null },
      select: {
        id: true, product: true, title: true, summary: true, body: true,
        externalUrl: true, isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async deleteContent(id: string, product: ProductType) {
    await this.assertContentExists(id, product);
    await this.prisma.productContent.delete({ where: { id } });
    return { success: true };
  }

  private async assertContentExists(id: string, product: ProductType) {
    const content = await this.prisma.productContent.findFirst({ where: { id, product }, select: { id: true } });
    if (!content) throw new NotFoundException("Conteúdo não encontrado.");
  }
}
