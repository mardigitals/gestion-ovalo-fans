import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Formato de email inválido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;
}