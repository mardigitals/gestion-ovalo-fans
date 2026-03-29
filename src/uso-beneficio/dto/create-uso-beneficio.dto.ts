import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEnum, IsDate, IsISO8601 } from 'class-validator';

export class CreateUsoBeneficioDto {

  @IsNotEmpty()
  @IsEnum(['VIP_BOXES', 'SALA_PRENSA', 'PLACA_RECTA', 'PACECAR_RESCATE', 'FAST_ACCESS', 'VISITAS_GUIADAS', 'REGALO_SUPERFAN', 'MULTIMEDIA_VIP', 'DESC_PRUEBAS', 'DESC_CARRERAS', 'DESC_RECITALES', 'DESC_COMERCIOS'])
  tipo_beneficio: string;

  @IsOptional()
  @IsISO8601() //VALIDA el JSON SIN ERRORES EN REACT ,IGUAL QUE @IsDateString 
  fecha_uso?: Date;

  @IsOptional()
  @IsNumber()
  evento_id?: number;

  @IsOptional()
  @IsNumber()
  comercio_id?: number;

  @IsOptional()
  @IsString()
  notas_staff?: string;
}