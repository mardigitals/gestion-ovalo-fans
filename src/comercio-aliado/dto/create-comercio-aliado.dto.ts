import {IsString, IsNotEmpty, IsInt, MaxLength, IsEnum, IsOptional, Length} from 'class-validator';

export class CreateComercioAliadoDto {

    @IsString()
    @MaxLength(100)
    @IsNotEmpty({message : 'El nombre del comercio es obligatorio'})
    nombre_comercio: string;

    @IsString()
    @IsNotEmpty()
    @Length(11, 13) 
    cuit: string;

    @IsString()
    @MaxLength(50)
    @IsOptional()
    rubro?: string;

    @IsInt()
    @IsOptional()    
    descuento_porcentaje?: number;

  
    @IsEnum(['SOLO_EFECTIVO', 'CON_TARJETA', 'CON_TRANSFERENCIA', 'EFECTIVO_TRANSFERENCIA', 'TODOS'])
    @IsNotEmpty()
    condicion_pago: string;

    @IsString()
    @MaxLength(150)
    @IsNotEmpty({message : 'Dirección obligatoria'})
    calle: string;

    @IsString()
    @MaxLength(10)
    @IsNotEmpty({message : 'Dirección obligatoria'})
    numero: string;

    @IsString()
    @MaxLength(50)
    @IsNotEmpty({message : 'Ciudad obligatoria'})
    ciudad: string;

    @IsString()
    @MaxLength(10)
    @IsNotEmpty({message : 'CP obligatoria'})
    cp: string;

}