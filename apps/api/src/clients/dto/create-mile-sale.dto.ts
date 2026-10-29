import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export enum MileSaleStatusDto {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export class CreateMileSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  buyerName?: string;

  @IsInt()
  @Min(1)
  @Max(1000000000)
  miles!: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  acquisitionCpm!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  grossAmount!: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fees?: number;

  @IsDateString()
  soldAt!: string;

  @IsOptional()
  @IsEnum(MileSaleStatusDto)
  status?: MileSaleStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
