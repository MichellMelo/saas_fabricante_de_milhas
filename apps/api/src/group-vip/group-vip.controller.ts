import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { AuthenticatedRequest, JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateGroupVipPostDto } from "./dto/create-group-vip-post.dto";
import { SetGroupVipPublicationDto } from "./dto/set-group-vip-publication.dto";
import { UpdateGroupVipPostDto } from "./dto/update-group-vip-post.dto";
import { GroupVipService } from "./group-vip.service";

@UseGuards(JwtAuthGuard)
@Controller("group-vip")
export class GroupVipController {
  constructor(private readonly groupVip: GroupVipService) {}

  private isAdmin(request: AuthenticatedRequest) {
    return request.user.isAdmin;
  }

  private assertAdmin(request: AuthenticatedRequest) {
    if (!this.isAdmin(request)) throw new ForbiddenException("Apenas administradores podem gerenciar o conteúdo do Grupo VIP.");
  }

  @Get("posts")
  async listPosts(@Req() request: AuthenticatedRequest) {
    if (!this.isAdmin(request)) await this.groupVip.assertProductAccess(request.user.id);
    return this.groupVip.listPosts(this.isAdmin(request));
  }

  @Post("posts")
  createPost(@Req() request: AuthenticatedRequest, @Body() dto: CreateGroupVipPostDto) {
    this.assertAdmin(request);
    return this.groupVip.createPost(request.user.id, dto);
  }

  @Post("posts/:id/update")
  updatePost(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: UpdateGroupVipPostDto) {
    this.assertAdmin(request);
    return this.groupVip.updatePost(id, dto);
  }

  @Post("posts/:id/publish")
  setPublished(@Req() request: AuthenticatedRequest, @Param("id") id: string, @Body() dto: SetGroupVipPublicationDto) {
    this.assertAdmin(request);
    return this.groupVip.setPublished(id, dto.published);
  }

  @Post("posts/:id/delete")
  deletePost(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    this.assertAdmin(request);
    return this.groupVip.deletePost(id);
  }
}
