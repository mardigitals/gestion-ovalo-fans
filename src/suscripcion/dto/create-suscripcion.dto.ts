import { IsInt, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateSuscripcionDto {
  @IsInt()
  perfil_fan_id: number;

  @IsInt()
  membresia_id: number;

  @IsDateString()
  fecha_inicio: Date;

  @IsDateString()
  fecha_fin: Date;

  @IsOptional()
  @IsEnum(['Activo', 'Vencido', 'Cancelado', 'Pendiente'])
  estado?: string;
}