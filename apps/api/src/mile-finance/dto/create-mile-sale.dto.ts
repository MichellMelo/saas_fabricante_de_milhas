import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreatePersonalMileSaleDto {
  @IsString() @MaxLength(128) loyaltyProgramId!: string;
  @IsOptional() @IsString() @MaxLength(180) buyerName?: string;
  @Type(() => Number) @IsInt() @Min(1) miles!: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) grossAmount!: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) fees?: number;
  @IsDateString() soldAt!: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
