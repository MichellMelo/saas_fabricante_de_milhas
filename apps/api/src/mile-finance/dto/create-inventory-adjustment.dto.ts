import { Type } from "class-transformer";
import { IsIn, IsInt, IsString, MaxLength, Min } from "class-validator";

export class CreateInventoryAdjustmentDto {
  @IsString() @MaxLength(128) loyaltyProgramId!: string;
  @Type(() => Number) @IsInt() @Min(1) miles!: number;
  @IsIn(["IN", "OUT"]) direction!: "IN" | "OUT";
  @IsString() @MaxLength(500) reason!: string;
}
