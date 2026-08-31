import { IsDateString, IsEmail, IsNumber, IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class CreatePerfilStaffDto {
  // --- DATOS DEL USUARIO BASE (Nuevos para unificar el flujo) ---
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // --- DATOS DEL PERFIL STAFF (Los que ya tenías) ---
  @IsNumber()
  @IsNotEmpty()
  rol_staff_id: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  area?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  cargo?: string;

  @IsDateString()
  @IsOptional() // Puede ser opcional si dejamos que el backend ponga la fecha actual por defecto
  fecha_ingreso?: string;
}