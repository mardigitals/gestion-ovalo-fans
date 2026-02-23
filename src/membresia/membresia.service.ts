import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateMembresiaDto } from './dto/create-membresia.dto';
import { UpdateMembresiaDto } from './dto/update-membresia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membresia } from './entities/membresia.entity';
@Injectable()
export class MembresiaService {

  constructor( 
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
  ) {}

  async create(createMembresiaDto: CreateMembresiaDto) {
    const existe = await this.membresiaRepository.findOne({ 
      where: { nombre: createMembresiaDto.nombre } 
    });

    if (existe) {
      throw new BadRequestException(`Ya existe una membresía con el nombre: ${createMembresiaDto.nombre}`);
    }

    const membresia = this.membresiaRepository.create(createMembresiaDto);
    return await this.membresiaRepository.save(membresia);
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
