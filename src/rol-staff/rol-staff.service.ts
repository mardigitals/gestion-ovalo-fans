import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRolStaffDto } from './dto/create-rol-staff.dto';
import { UpdateRolStaffDto } from './dto/update-rol-staff.dto';
import { RolStaff } from './entities/rol-staff.entity';
import { PerfilStaff } from '../perfil-staff/entities/perfil-staff.entity';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class RolStaffService {
  constructor(
    @InjectRepository(RolStaff)
    private readonly rolRepository: Repository<RolStaff>,
    @InjectRepository(PerfilStaff)
    private readonly perfilStaffRepository: Repository<PerfilStaff>,
  ) {}

  async create(dto: CreateRolStaffDto) {
    const nuevoRol = this.rolRepository.create(dto);
    return await this.rolRepository.save(nuevoRol);
  }

  async findAll() {
    return await this.rolRepository.find();
  }

  async findOne(id: number) {
    const rol = await this.rolRepository.findOne({ where: { id } });
    if (!rol) {
      throw new NotFoundException(`El rol con ID #${id} no existe.`);
    }
    return rol;
  }

  async update(id: number, dto: UpdateRolStaffDto) {
    await this.findOne(id); 
    await this.rolRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const rol = await this.findOne(id); // Validamos que el rol exista
    
    // 2. Contamos cuántos perfiles tienen este rol asignado
    const perfilesConEsteRol = await this.perfilStaffRepository.count({
      where: { rolStaff: { id: id } }
    });

    // 3. Si hay gente usando el rol, bloqueamos el borrado 
    if (perfilesConEsteRol > 0) {
      throw new BadRequestException(
        `Imposible borrar: El rol "${rol.nombre_rol}" está siendo usado por ${perfilesConEsteRol} miembro(s) del staff. Reasigná a esas personas antes de eliminar el rol.`
      );
    }

    // 4. Si el contador dio 0, borramos físicamente con total seguridad
    await this.rolRepository.delete(id);
    
    return { mensaje: `El rol #${id} (${rol.nombre_rol}) fue eliminado de la base de datos de manera segura.` };
  }
}