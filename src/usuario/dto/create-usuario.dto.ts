import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, IsInt } from 'class-validator';

export class CreateUsuarioDto {
  
  @IsInt()
  @IsNotEmpty()
  usuario_auth_id: number; // Este une con la cuenta de email

  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  @IsNotEmpty()
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
  telefono: string;

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