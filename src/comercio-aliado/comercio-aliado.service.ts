import { Injectable } from '@nestjs/common';
import { CreateComercioAliadoDto } from './dto/create-comercio-aliado.dto';
import { UpdateComercioAliadoDto } from './dto/update-comercio-aliado.dto';

@Injectable()
export class ComercioAliadoService {
  create(createComercioAliadoDto: CreateComercioAliadoDto) {
    return 'This action adds a new comercioAliado';
  }

  findAll() {
    return `This action returns all comercioAliado`;
  }

  findOne(id: number) {
    return `This action returns a #${id} comercioAliado`;
  }

  update(id: number, updateComercioAliadoDto: UpdateComercioAliadoDto) {
    return `This action updates a #${id} comercioAliado`;
  }

  remove(id: number) {
    return `This action removes a #${id} comercioAliado`;
  }
}
