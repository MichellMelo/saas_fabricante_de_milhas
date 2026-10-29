import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateAccountDto {
  @IsString()
  @MaxLength(100)
  loyaltyProgramId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  memberReference?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  initialBalance?: number;
}
