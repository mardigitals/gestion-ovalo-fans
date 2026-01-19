import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class CreateUsuarioAuthDto {
  @IsEmail({}, { message: 'El formato del correo no es válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial (ej: @, #, <, $, etc.)',
  })
  contrasena: string;
}
