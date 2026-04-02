import { PartialType } from '@nestjs/mapped-types';
import { CreateComercioAliadoDto } from './create-comercio-aliado.dto';

export class UpdateComercioAliadoDto extends PartialType(CreateComercioAliadoDto) {}
