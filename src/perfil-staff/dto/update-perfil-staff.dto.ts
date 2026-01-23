import { PartialType } from '@nestjs/mapped-types';
import { CreatePerfilStaffDto } from './create-perfil-staff.dto';

export class UpdatePerfilStaffDto extends PartialType(CreatePerfilStaffDto) {}
