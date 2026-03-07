import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePerfilFanDto {
    
  @IsString()
  @MaxLength(20)
  alias: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsBoolean()
  @IsOptional()
  es_socio_club?: boolean;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  bio?: string;

  @IsEnum(['Ford', 'Chevrolet', 'Torino', 'Dodge', 'Toyota', 'Mercedes', 'Bmw'])
  @IsOptional()
  hincha_marca_tc?: string;

  @IsEnum(['1 de adentro', '1 de afuera', '2 de adentro', '2 de afuera', '3'])
  @IsOptional()
  chicana_favorita?: string;
}