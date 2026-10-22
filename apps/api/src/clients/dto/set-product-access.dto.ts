import { IsBoolean, IsDateString, IsEnum, IsOptional } from "class-validator";
import { ProductType } from "@prisma/client";

export class SetProductAccessDto {
  @IsEnum(ProductType)
  product!: ProductType;

  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
