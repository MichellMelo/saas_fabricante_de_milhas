import { IsBoolean, IsDateString, IsEnum, IsOptional } from "class-validator";
import { ProductType, SubscriptionPeriod } from "@prisma/client";

export class SetProductAccessDto {
  @IsEnum(ProductType)
  product!: ProductType;

  @IsBoolean()
  active!: boolean;

  @IsOptional()
  @IsEnum(SubscriptionPeriod)
  period?: SubscriptionPeriod;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}
