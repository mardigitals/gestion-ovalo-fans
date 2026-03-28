import { 
  IsString, 
  IsNotEmpty,
  IsDateString, 
  IsEnum, 
  IsOptional, 
  MaxLength 
} from 'class-validator';

export class CreateEventoDto {
    @IsNotEmpty({ message: 'El título es obligatorio' })
    @IsString({ message: 'El título debe ser una cadena de texto' })
    @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
    titulo: string;

    @IsNotEmpty({ message: 'La fecha del evento es obligatoria' })
    @IsDateString({}, { message: 'La fecha debe tener un formato válido (YYYY-MM-DD)' })
    fecha_evento: string;

    @IsEnum(['Carrera', 'Recital', 'Pruebas','Otros'], {
        message: 'El tipo de evento debe ser Carrera, Recital, Pruebas o Otros'
    })
    tipo_evento: string;

    @IsOptional()
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    descripcion?: string;

    @IsOptional()
    @IsEnum(['TC', 'TURISMO PISTA', 'TC PICK UP', 'TC MOURAS', 'TC 2000', 'TURISMO NACIONAL', 'CARSHOW SANTAFESINO', 'TZ SANTAFESINO','CORDOBA PISTA', 'KARTING', 'PICADAS', 'Otros'], {
        message: 'La categoría de carrera debe ser una de las siguientes: TC, TURISMO PISTA, TC PICK UP, TC MOURAS, TC 2000, TURISMO NACIONAL, CARSHOW SANTAFESINO, TZ SANTAFESINO, CORDOBA PISTA, KARTING, PICADAS o Otros'
    })
    categoria_carrera?: string;
}
