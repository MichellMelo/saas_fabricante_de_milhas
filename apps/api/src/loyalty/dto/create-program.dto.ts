import { IsEnum, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { LoyaltyProgramType } from "@prisma/client";

export class CreateProgramDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsEnum(LoyaltyProgramType)
  type!: LoyaltyProgramType;
}
