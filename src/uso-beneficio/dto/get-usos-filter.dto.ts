import { Type } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsISO8601, Min, IsInt } from 'class-validator';

export class GetUsosFilterDto {
  @IsOptional()
  @IsString()
  dni?: string;

  @IsOptional()
  @IsISO8601() 
  fecha?: string;

  @IsOptional()
  @IsEnum(['VIP_BOXES', 'SALA_PRENSA', 'PLACA_RECTA', 'PACECAR_RESCATE', 'FAST_ACCESS', 'VISITAS_GUIADAS', 'REGALO_SUPERFAN', 'MULTIMEDIA_VIP', 'DESC_PRUEBAS', 'DESC_CARRERAS', 'DESC_RECITALES', 'DESC_COMERCIOS'], {
    message: 'El tipo de beneficio a buscar no es válido.'
  })
  tipo_beneficio?: string;

  @IsOptional()
  @IsEnum(['Pendiente', 'Aprobado', 'Rechazado', 'Completado'], {
    message: 'El estado a buscar no es válido.'
  })
  estado?: string;

  @IsOptional()
  @Type(() => Number) 
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number = 10;
}