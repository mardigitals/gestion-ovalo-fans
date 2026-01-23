import { Injectable } from '@nestjs/common';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';

@Injectable()
export class PerfilFanService {
  create(createPerfilFanDto: CreatePerfilFanDto) {
    return 'This action adds a new perfilFan';
  }

  findAll() {
    return `This action returns all perfilFan`;
  }

  findOne(id: number) {
    return `This action returns a #${id} perfilFan`;
  }

  update(id: number, updatePerfilFanDto: UpdatePerfilFanDto) {
    return `This action updates a #${id} perfilFan`;
  }

  remove(id: number) {
    return `This action removes a #${id} perfilFan`;
  }
}
