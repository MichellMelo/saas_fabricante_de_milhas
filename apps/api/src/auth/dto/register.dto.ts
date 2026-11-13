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
 @MinLength(6, { message: "A senha deve ter pelo menos 6 caracteres." })
 @MaxLength(72)
 @Matches(/\p{Lu}/u, { message: "A senha deve conter uma letra maiúscula." })
 @Matches(/\p{Nd}/u, { message: "A senha deve conter um número." })
 @Matches(/[\p{P}\p{S}]/u, { message: "A senha deve conter um caractere especial." })
 password!: string;

 @IsString()
 @MaxLength(72)
 passwordConfirmation!: string;
}
