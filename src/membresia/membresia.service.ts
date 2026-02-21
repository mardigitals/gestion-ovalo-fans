import { Injectable } from '@nestjs/common';
import { CreateMembresiaDto } from './dto/create-membresia.dto';
import { UpdateMembresiaDto } from './dto/update-membresia.dto';

@Injectable()
export class MembresiaService {
  create(createMembresiaDto: CreateMembresiaDto) {
    return 'This action adds a new membresia';
  }

  findAll() {
    return `This action returns all membresia`;
  }

  findOne(id: number) {
    return `This action returns a #${id} membresia`;
  }

  update(id: number, updateMembresiaDto: UpdateMembresiaDto) {
    return `This action updates a #${id} membresia`;
  }

  remove(id: number) {
    return `This action removes a #${id} membresia`;
  }
}
