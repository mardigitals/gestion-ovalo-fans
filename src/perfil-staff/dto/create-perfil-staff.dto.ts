import { IsDateString, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePerfilStaffDto {
  @IsNumber()
  usuario_id: number;

  @IsNumber()
  rol_staff_id: number;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  area?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  cargo?: string;

  @IsDateString() // Para validar que la fecha sea un string de fecha válido (YYYY-MM-DD)
  fecha_ingreso: string;
}