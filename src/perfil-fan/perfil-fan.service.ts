import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';
import { PerfilFan } from './entities/perfil-fan.entity';
import { ForbiddenException } from '@nestjs/common/exceptions';

@Injectable()
export class PerfilFanService {
  constructor(
    @InjectRepository(PerfilFan)
    private readonly perfilFanRepository: Repository<PerfilFan>,
  ) {}

  
  async create(createPerfilFanDto: CreatePerfilFanDto, usuarioId: number) {

    if (!usuarioId) {
      throw new BadRequestException('No se pudo obtener el ID del usuario desde el token.');
    }


    const perfilExistente = await this.perfilFanRepository.findOne({ 
      where: { usuario_id: usuarioId } 
    });

    if (perfilExistente) {
      throw new BadRequestException('Este usuario ya tiene un perfil de fan creado.');
    }


    const nuevoPerfil = this.perfilFanRepository.create(createPerfilFanDto);
    nuevoPerfil.usuario_id = usuarioId; 

    return await this.perfilFanRepository.save(nuevoPerfil);
  }

  async findAll(pagina: number = 1, limite: number = 10) {
    const saltar = (pagina - 1) * limite;

    // findAndCount devuelve un array: [datos, total_registros]
    const [data, total] = await this.perfilFanRepository.findAndCount({
      relations: ['usuario'],
      take: limite,
      skip: saltar,
      order: { id: 'DESC' } 
    });

    return {
      data,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    };
  }
  
  async findOne(id: number, usuarioIdSolicitante: number, rolSolicitante: string) {
    const perfil = await this.perfilFanRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!perfil) {
      throw new NotFoundException(`No se encontró el perfil Fan con ID ${id}`);
    }


    const esStaff = ['SuperAdmin', 'Administrativo'].includes(rolSolicitante);
    
    
    const esDueño = Number(perfil.usuario.usuario_auth_id) === Number(usuarioIdSolicitante);

    if (!esStaff && !esDueño) {
      throw new ForbiddenException('No tenés permiso para ver este perfil ajeno.');
    }

    return perfil;
  }

  async update(id: number, updatePerfilFanDto: UpdatePerfilFanDto, usuarioId: number) {

    const perfil = await this.findOne(id, usuarioId, 'Fan'); 

    if (Number(perfil.usuario_id) !== Number(usuarioId)) {
      throw new BadRequestException('No tenés permisos para modificar este perfil.');
    }

    const perfilActualizado = this.perfilFanRepository.merge(perfil, updatePerfilFanDto);
    return await this.perfilFanRepository.save(perfilActualizado);
  }
}