import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class BootstrapFirstAdminDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}
