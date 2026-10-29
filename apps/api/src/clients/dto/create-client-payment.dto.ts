import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";
import { PaymentMethod, ProductType } from "@prisma/client";

export class CreateClientPaymentDto {
  @IsString()
  userId!: string;

  @IsEnum(ProductType)
  product!: ProductType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsDateString()
  dueAt!: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
