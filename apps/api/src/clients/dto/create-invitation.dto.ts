import { ArrayUnique, IsArray, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ProductType } from "@prisma/client";

export class CreateInvitationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsArray()
  @ArrayUnique()
  @IsEnum(ProductType, { each: true })
  products!: ProductType[];
}
