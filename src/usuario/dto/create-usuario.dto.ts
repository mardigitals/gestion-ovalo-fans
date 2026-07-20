import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsInt, Matches } from 'class-validator';
import { IsAdult } from '../decorators/is-adult.decorators';

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
  @IsAdult({ message: 'No cumples con la edad mínima de 18 años para registrarte.' }) 
  fecha_nacimiento: string;

  @IsEnum(['M', 'F', 'Prefiero no decirlo'])
  @IsNotEmpty()
  genero: string;

  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'La nacionalidad solo debe contener letras.' })
  nacionalidad?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'El teléfono solo debe contener números, sin guiones ni espacios.' })
  telefono: string;

  @IsString()
  @IsNotEmpty()
  calle: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'El número de calle no debe contener letras.' })
  numero: string;

  @IsString()
  @IsOptional()
  piso?: string;

  @IsString()
  @IsOptional()
  depto?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'El código postal solo debe contener números.' })
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