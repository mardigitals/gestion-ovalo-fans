import { PartialType } from '@nestjs/mapped-types';
import { CreateRolStaffDto } from './create-rol-staff.dto';

export class UpdateRolStaffDto extends PartialType(CreateRolStaffDto) {}
