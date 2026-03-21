import { PartialType } from '@nestjs/mapped-types';
import { CreateUsoBeneficioDto } from './create-uso-beneficio.dto';

export class UpdateUsoBeneficioDto extends PartialType(CreateUsoBeneficioDto) {}
