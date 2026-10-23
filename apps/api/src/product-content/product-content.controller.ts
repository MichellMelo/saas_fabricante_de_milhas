import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ProductType } from "@prisma/client";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateGroupVipPostDto } from "../group-vip/dto/create-group-vip-post.dto";
import { UpdateGroupVipPostDto } from "../group-vip/dto/update-group-vip-post.dto";
import { SetGroupVipPublicationDto } from "../group-vip/dto/set-group-vip-publication.dto";
import { ProductContentService } from "./product-content.service";

@UseGuards(JwtAuthGuard)
@Controller("product-content")
export class ProductContentController {
  constructor(private readonly content: ProductContentService) {}

  private isAdmin(request: AuthenticatedRequest) {
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
    return admins.includes(request.user.email.trim().toLowerCase());
  }

  private parseProduct(value: string): ProductType {
    if (value === "AULAO") return ProductType.AULAO;
    if (value === "MENTORSHIP") return ProductType.MENTORSHIP;
    throw new BadRequestException("Produto inválido. Use AULAO ou MENTORSHIP.");
  }

  private assertAdmin(request: AuthenticatedRequest) {
    if (!this.isAdmin(request)) throw new ForbiddenException("Apenas administradores podem gerenciar esse conteúdo.");
  }

  @Get(":product")
  async list(@Req() request: AuthenticatedRequest, @Param("product") productValue: string) {
    const product = this.parseProduct(productValue);
    if (!this.isAdmin(request)) await this.content.assertProductAccess(request.user.id, product);
    return this.content.listContent(product, this.isAdmin(request));
  }

  @Post(":product")
  create(@Req() request: AuthenticatedRequest, @Param("product") productValue: string, @Body() dto: CreateGroupVipPostDto) {
    this.assertAdmin(request);
    return this.content.createContent(request.user.id, this.parseProduct(productValue), dto);
  }

  @Post(":product/:id/update")
  update(@Req() request: AuthenticatedRequest, @Param("product") productValue: string, @Param("id") id: string, @Body() dto: UpdateGroupVipPostDto) {
    this.assertAdmin(request);
    return this.content.updateContent(id, this.parseProduct(productValue), dto);
  }

  @Post(":product/:id/publish")
  publish(@Req() request: AuthenticatedRequest, @Param("product") productValue: string, @Param("id") id: string, @Body() dto: SetGroupVipPublicationDto) {
    this.assertAdmin(request);
    return this.content.setPublished(id, this.parseProduct(productValue), dto.published);
  }

  @Post(":product/:id/delete")
  delete(@Req() request: AuthenticatedRequest, @Param("product") productValue: string, @Param("id") id: string) {
    this.assertAdmin(request);
    return this.content.deleteContent(id, this.parseProduct(productValue));
  }
}
