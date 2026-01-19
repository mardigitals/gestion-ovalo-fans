import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'La nueva contraseña debe tener al menos una mayúscula, un número y un carácter especial.',
  })
  nuevaContrasena: string;
}