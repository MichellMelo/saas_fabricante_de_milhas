import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateMilePurchaseDto {
  @IsString() @MaxLength(128) loyaltyProgramId!: string;
  @Type(() => Number) @IsInt() @Min(1) miles!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) grossAmount!: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) fees?: number;
  @IsDateString() purchasedAt!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
