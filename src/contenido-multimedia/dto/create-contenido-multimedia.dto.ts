import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsUrl, 
  IsInt, 
  IsOptional, 
  Min, 
  MaxLength 
} from 'class-validator';

export class CreateContenidoMultimediaDto {
  
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
  titulo: string;

  @IsEnum(['Video', 'Foto', 'Nota'], { 
    message: 'El tipo debe ser video, foto o nota' 
  })
  tipo: string;

  @IsUrl({}, { message: 'Debe proporcionar una URL válida para el recurso' })
  @IsNotEmpty({ message: 'La URL del recurso es obligatoria' })
  url_recurso: string;

  @IsInt({ message: 'El nivel de acceso debe ser un número entero' })
  @Min(0, { message: 'El nivel de acceso no puede ser negativo' })
  @IsOptional()
  nivel_acceso_requerido?: number;

}