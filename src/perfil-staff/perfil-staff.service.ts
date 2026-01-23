import { Injectable } from '@nestjs/common';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';

@Injectable()
export class PerfilStaffService {
  create(createPerfilStaffDto: CreatePerfilStaffDto) {
    return 'This action adds a new perfilStaff';
  }

  findAll() {
    return `This action returns all perfilStaff`;
  }

  findOne(id: number) {
    return `This action returns a #${id} perfilStaff`;
  }

  update(id: number, updatePerfilStaffDto: UpdatePerfilStaffDto) {
    return `This action updates a #${id} perfilStaff`;
  }

  remove(id: number) {
    return `This action removes a #${id} perfilStaff`;
  }
}
