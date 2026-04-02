import { IsString, Length } from 'class-validator';

export class Enable2faDto {
  @IsString()
  @Length(6, 6, { message: 'El código 2FA debe tener 6 dígitos' })
  code: string;
}