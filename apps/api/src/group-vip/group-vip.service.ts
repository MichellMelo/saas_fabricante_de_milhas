import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGroupVipPostDto } from "./dto/create-group-vip-post.dto";
import { UpdateGroupVipPostDto } from "./dto/update-group-vip-post.dto";

@Injectable()
export class GroupVipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertProductAccess(userId: string) {
    const now = new Date();
    const access = await this.prisma.userProductAccess.findFirst({
      where: {
        userId,
        product: "GROUP_VIP",
        active: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    if (!access) throw new ForbiddenException("Seu acesso ao Grupo VIP não está ativo. Entre em contato com a equipe.");
  }

  async listPosts(isAdmin: boolean) {
    return this.prisma.groupVipPost.findMany({
      where: isAdmin ? {} : { isPublished: true, publishedAt: { lte: new Date() } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        summary: true,
        body: true,
        externalUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { name: true } },
      },
    });
  }

  async createPost(authorId: string, dto: CreateGroupVipPostDto) {
    const publishNow = false;
    return this.prisma.groupVipPost.create({
      data: {
        title: dto.title.trim(),
        summary: dto.summary?.trim() || null,
        body: dto.body.trim(),
        externalUrl: dto.externalUrl?.trim() || null,
        isPublished: publishNow,
        authorId,
      },
      select: {
        id: true, title: true, summary: true, body: true, externalUrl: true,
        isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async updatePost(id: string, dto: UpdateGroupVipPostDto) {
    await this.assertPostExists(id);
    return this.prisma.groupVipPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.summary !== undefined ? { summary: dto.summary?.trim() || null } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        ...(dto.externalUrl !== undefined ? { externalUrl: dto.externalUrl?.trim() || null } : {}),
      },
      select: {
        id: true, title: true, summary: true, body: true, externalUrl: true,
        isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async setPublished(id: string, published: boolean) {
    await this.assertPostExists(id);
    return this.prisma.groupVipPost.update({
      where: { id },
      data: { isPublished: published, publishedAt: published ? new Date() : null },
      select: {
        id: true, title: true, summary: true, body: true, externalUrl: true,
        isPublished: true, publishedAt: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async deletePost(id: string) {
    await this.assertPostExists(id);
    await this.prisma.groupVipPost.delete({ where: { id } });
    return { success: true };
  }

  private async assertPostExists(id: string) {
    const post = await this.prisma.groupVipPost.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new NotFoundException("Publicação não encontrada.");
  }
}
