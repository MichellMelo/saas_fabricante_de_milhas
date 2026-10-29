import { IsString, MinLength } from "class-validator";

export class AdminPasswordConfirmationDto {
  @IsString()
  @MinLength(1)
  currentPassword!: string;
}
