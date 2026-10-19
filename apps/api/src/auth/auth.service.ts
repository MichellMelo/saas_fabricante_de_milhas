import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
 constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

 async register(dto: RegisterDto) {
  const email = dto.email.trim().toLowerCase();
  const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw new ConflictException("Não foi possível criar a conta com esse e-mail.");
  const passwordHash = await hash(dto.password, 12);
  try {
   const user = await this.prisma.user.create({
    data: { email, passwordHash, name: dto.name?.trim() || null },
    select: { id: true, email: true, name: true, createdAt: true }
   });
   return { user, accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email }) };
  } catch (error) {
   // A second concurrent registration can pass the initial lookup. The unique
   // database constraint remains authoritative and must not leak as HTTP 500.
   if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ConflictException("Não foi possível criar a conta com esse e-mail.");
   }
   throw error;
  }
 }

 async login(dto: LoginDto) {
  const email = dto.email.trim().toLowerCase();
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user || !(await compare(dto.password, user.passwordHash))) {
   throw new UnauthorizedException("E-mail ou senha inválidos.");
  }
  return {
   user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
   accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email })
  };
 }

 async getPublicUser(userId: string) {
  const user = await this.prisma.user.findUnique({
   where: { id: userId },
   select: { id: true, email: true, name: true, createdAt: true }
  });
  if (!user) throw new UnauthorizedException("Sessão inválida.");
  return user;
 }
}
