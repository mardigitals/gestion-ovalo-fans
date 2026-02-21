import { MaxLength, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateMembresiaDto {
    @IsString()
    @MaxLength(30)
    nombre: string;

    @IsNumber({}, { message: 'El precio mensual debe ser un número' })
    precio_mensual: number;

    @IsNumber({}, { message: 'El precio mensual debe ser un número' })
    precio_anual: number;

    @IsString()
    @IsOptional()
    descripcion_beneficios: string;

}
