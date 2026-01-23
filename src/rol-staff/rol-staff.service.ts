import { Injectable } from '@nestjs/common';
import { CreateRolStaffDto } from './dto/create-rol-staff.dto';
import { UpdateRolStaffDto } from './dto/update-rol-staff.dto';

@Injectable()
export class RolStaffService {
  create(createRolStaffDto: CreateRolStaffDto) {
    return 'This action adds a new rolStaff';
  }

  findAll() {
    return `This action returns all rolStaff`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rolStaff`;
  }

  update(id: number, updateRolStaffDto: UpdateRolStaffDto) {
    return `This action updates a #${id} rolStaff`;
  }

  remove(id: number) {
    return `This action removes a #${id} rolStaff`;
  }
}
