import { Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateInventoryAdjustmentDto {
  @IsString() @MaxLength(128) loyaltyProgramId!: string;
  @Type(() => Number) @IsInt() @Min(1) miles!: number;
  @IsIn(["IN", "OUT"]) direction!: "IN" | "OUT";
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 4 }) @Min(0) unitCostCpm?: number;
  @IsString() @MaxLength(500) reason!: string;
}
