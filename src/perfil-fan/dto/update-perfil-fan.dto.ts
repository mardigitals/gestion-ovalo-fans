import { PartialType } from '@nestjs/mapped-types';
import { CreatePerfilFanDto } from './create-perfil-fan.dto';

export class UpdatePerfilFanDto extends PartialType(CreatePerfilFanDto) {}
