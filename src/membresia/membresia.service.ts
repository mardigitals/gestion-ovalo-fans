import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
  
  async findAll() {
    return await this.membresiaRepository.find({ withDeleted: true });
  }

  async findOne(id: number) {
    const membresia = await this.membresiaRepository.findOneBy({ id });
    
    if (!membresia) {
      throw new NotFoundException(`La membresía con ID ${id} no existe`);
    }
    
    return membresia;
  }


  async update(id: number, updateMembresiaDto: UpdateMembresiaDto) {
    
    const membresia = await this.findOne(id);

    const membresiaActualizada = this.membresiaRepository.merge(membresia, updateMembresiaDto);

    return await this.membresiaRepository.save(membresiaActualizada);
  }


  async remove(id: number) {
    const membresia = await this.findOne(id);
    
    await this.membresiaRepository.softRemove(membresia);

    return { 
      message: `La membresía '${membresia.nombre}' fue dada de baja. Ya no será visible para nuevos socios, pero se mantiene el registro histórico.` 
    };
  }

  
  async restore(id: number) {
    
    const membresia = await this.membresiaRepository.findOne({
      where: { id },
      withDeleted: true, 
    });

    if (!membresia) {
      throw new NotFoundException(`No se encontró la membresía con ID ${id}`);
    }

    if (!membresia.eliminado_en) {
      throw new BadRequestException('La membresía ya se encuentra activa');
    }

    await this.membresiaRepository.restore(id);
    
    return { 
      message: `La membresía '${membresia.nombre}' ha sido reactivada correctamente.` 
    };
}
}
