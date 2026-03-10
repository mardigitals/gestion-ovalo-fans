import { IsInt, IsDateString, IsEnum, IsOptional } from 'class-validator';

export class CreateSuscripcionDto {

  @IsOptional()
  @IsInt()
  perfil_fan_id?: number;

  @IsInt()
  membresia_id: number;

  @IsOptional()
  @IsDateString()
  fecha_inicio?: Date;

  @IsOptional()
  @IsDateString()
  fecha_fin?: Date;

  @IsOptional()
  @IsEnum(['Activo', 'Vencido', 'Cancelado', 'Pendiente'])
  estado?: string;
}