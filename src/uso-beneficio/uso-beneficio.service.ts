import { Injectable } from '@nestjs/common';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { UpdateUsoBeneficioDto } from './dto/update-uso-beneficio.dto';

@Injectable()
export class UsoBeneficioService {
  create(createUsoBeneficioDto: CreateUsoBeneficioDto) {
    return 'This action adds a new usoBeneficio';
  }

  findAll() {
    return `This action returns all usoBeneficio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usoBeneficio`;
  }

  update(id: number, updateUsoBeneficioDto: UpdateUsoBeneficioDto) {
    return `This action updates a #${id} usoBeneficio`;
  }

  remove(id: number) {
    return `This action removes a #${id} usoBeneficio`;
  }
}
