import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsInt, Matches } from 'class-validator';

export class CreateUsuarioDto {
  
  @IsInt()
  @IsNotEmpty()
  usuario_auth_id: number; 

  @IsString()
  @IsNotEmpty()
  // Solo acepta mayúsculas, minúsculas, acentos, la ñ y espacios.
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El nombre solo debe contener letras.' })
  nombre: string;

  @IsString()
  @IsNotEmpty()
  // Misma regla para el apellido
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El apellido solo debe contener letras.' })
  apellido: string;

  @IsString()
  @IsNotEmpty()
  // Solo acepta números, y exige que sean exactamente entre 7 y 8 dígitos.
  @Matches(/^[0-9]{7,8}$/, { message: 'El DNI debe contener entre 7 y 8 números, sin puntos.' })
  dni: string;

  @IsDateString()
  @IsNotEmpty()
  fecha_nacimiento: string;

  @IsEnum(['M', 'F', 'Prefiero no decirlo'])
  @IsNotEmpty()
  genero: string;

  @IsString()
  @IsOptional()
  nacionalidad?: string;

  @IsString()
  @IsNotEmpty()
  // Solo acepta números (podés sumarle el símbolo + si usás prefijos internacionales: /^[0-9+]+$/ )
  @Matches(/^[0-9]+$/, { message: 'El teléfono solo debe contener números, sin guiones ni espacios.' })
  telefono: string;

  // ... (El resto de tus campos de domicilio quedan igual) ...
  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsOptional()
  piso?: string;

  @IsString()
  @IsOptional()
  depto?: string;

  @IsString()
  @IsNotEmpty()
  cp: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  provincia: string;

  @IsString()
  @IsOptional()
  pais?: string;
}