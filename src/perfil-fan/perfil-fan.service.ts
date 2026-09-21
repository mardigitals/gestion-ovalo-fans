import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';
import { PerfilFan } from './entities/perfil-fan.entity';
import { UsuarioAuth } from '../usuario_auth/entities/usuario_auth.entity';

@Injectable()
export class PerfilFanService {
  constructor(
    @InjectRepository(PerfilFan)
    private readonly perfilFanRepository: Repository<PerfilFan>,
    
    // Inyectamos el repo de auth para poder cambiar el estado
    @InjectRepository(UsuarioAuth)
    private readonly usuarioAuthRepository: Repository<UsuarioAuth>,
  ) {}

  async create(createPerfilFanDto: CreatePerfilFanDto, usuarioId: number, usuarioAuthId: number) {
    if (!usuarioId) {
      throw new BadRequestException('No se pudo obtener el ID del usuario desde el token.');
    }

    const perfilExistente = await this.perfilFanRepository.findOne({ 
      where: { usuario_id: usuarioId } 
    });

    if (perfilExistente) {
      throw new BadRequestException('Este usuario ya tiene un perfil de fan creado.');
    }

    // 1. Creamos y guardamos el perfil del fan
    const nuevoPerfil = this.perfilFanRepository.create(createPerfilFanDto);
    nuevoPerfil.usuario_id = usuarioId; 
    const perfilGuardado = await this.perfilFanRepository.save(nuevoPerfil);

    // 2. Activamos la cuenta en la tabla usuario_auth
    if (usuarioId) {
        await this.usuarioAuthRepository.update(
            usuarioAuthId,
            { estado_cuenta: 'Activo' }
        );
    }

    return perfilGuardado;
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
    // 1. Buscamos directo a la BD (evitamos usar this.findOne para que no nos tire el 403)
    const perfil = await this.perfilFanRepository.findOne({ where: { id } });

    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado');
    }

    // 2. Tu validación con Number() que es a prueba de balas
    if (Number(perfil.usuario_id) !== Number(usuarioId)) {
        throw new BadRequestException('No tenés permisos para modificar este perfil.');
    }

    // 3. Guardamos los cambios
    const perfilActualizado = this.perfilFanRepository.merge(perfil, updatePerfilFanDto);
    return await this.perfilFanRepository.save(perfilActualizado);
  }

  async actualizarAvatar(id: number, avatarUrl: string) {
    const perfil = await this.perfilFanRepository.findOne({ where: { id } });
    if (!perfil) {
      throw new NotFoundException('Perfil no encontrado');
    }

    perfil.avatar = avatarUrl;
    await this.perfilFanRepository.save(perfil);

    return { 
      message: 'Avatar actualizado', 
      url: avatarUrl 
    };
  }
}