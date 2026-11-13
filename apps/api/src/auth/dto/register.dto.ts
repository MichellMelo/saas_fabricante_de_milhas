import { Transform } from "class-transformer";
import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
 @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
 @IsString()
 @MinLength(2, { message: "Informe seu nome completo." })
 @MaxLength(100)
 name!: string;

 @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
 @IsEmail({}, { message: "Informe um e-mail válido." })
 @MaxLength(254)
 email!: string;

 @IsString()
 @MinLength(12, { message: "A senha deve ter pelo menos 12 caracteres." })
 @MaxLength(72)
 @Matches(/^(?=.*\p{L})(?=.*\p{N})/su, { message: "A senha deve conter letras e números." })
 password!: string;

 @IsString()
 @MaxLength(72)
 passwordConfirmation!: string;
}
