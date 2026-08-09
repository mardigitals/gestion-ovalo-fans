import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsUrl, 
  IsInt, 
  IsOptional, 
  Min,
  IsBoolean, 
  MaxLength 
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';

export class CreateContenidoMultimediaDto {
  
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
  titulo: string;

  @IsEnum(['noticia', 'video', 'imagen'], { 
    message: 'El tipo debe ser noticia, video o imagen' 
  })
  tipo: string;

  @IsOptional()
  @IsUrl({}, { message: 'Debe proporcionar una URL válida para el recurso' })
  url_recurso?: string;

  @Type(() => Number)
  @IsInt({ message: 'El nivel de acceso debe ser un número entero' })
  @IsOptional()
  @Min(0, { message: 'El nivel de acceso no puede ser negativo' })
  nivel_acceso_requerido?: number;

  @IsOptional() 
  @Transform(({ value }) => value === 'true' || value === '1' || value === true)
  @IsBoolean({ message: 'es_destacado debe ser un valor booleano' })
  es_destacado?: boolean;

}