import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsOptional()
  @Length(6, 6, { message: 'El código 2FA debe tener 6 dígitos' })
  twoFactorCode?: string;
}