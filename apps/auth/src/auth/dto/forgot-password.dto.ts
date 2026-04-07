import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Correo electrónico inválido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}