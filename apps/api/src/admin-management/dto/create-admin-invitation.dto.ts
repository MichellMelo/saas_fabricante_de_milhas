import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateAdminInvitationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
