import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateRolStaffDto {
    @IsString()
    @IsNotEmpty({ message: 'El título es obligatorio' })
    @MaxLength(50, { message: 'El nombre del rol no puede superar los 50 caracteres' })
    nombre_rol: string;
}
