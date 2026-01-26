import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilStaff } from './entities/perfil-staff.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';



@Injectable()
export class PerfilStaffService {

  constructor(
    @InjectRepository(PerfilStaff)
    private readonly perfilStaffRepository: Repository<PerfilStaff>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createPerfilStaffDto: CreatePerfilStaffDto) {
    // 1. Creamos la instancia del perfil
    const nuevoStaff = this.perfilStaffRepository.create(createPerfilStaffDto);
    
    // 2. Guardamos en la tabla perfil_staff
    const staffGuardado = await this.perfilStaffRepository.save(nuevoStaff);

    // 3. Lógica para la presentación: 
    // Actualizamos el rol del usuario base a 'staff' para que el Guard lo reconozca
    await this.usuarioRepository.update(createPerfilStaffDto.usuario_id, {
       // Aquí podrías setear un campo 'esStaff' o similar si lo tenés
    });

    return staffGuardado;
  }

  async update(id: number, updatePerfilStaffDto: UpdatePerfilStaffDto) {
  // 1. Buscamos el perfil existente (esto ya valida que exista con findOne)
  const staff = await this.findOne(id);

  try {
    // 2. Mezclamos los datos del DTO sobre la entidad encontrada
    const staffActualizado = Object.assign(staff, updatePerfilStaffDto);
    
    // 3. Guardamos los cambios
    return await this.perfilStaffRepository.save(staffActualizado);
  } catch (error) {
    // Manejo de error de FK por si el rol_staff_id no existe
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new BadRequestException('El rol de staff proporcionado no es válido.');
    }
    throw new InternalServerErrorException('Error inesperado al actualizar el perfil de staff.');
  }
}

  async findAll() {
    return await this.perfilStaffRepository.find({
      relations: ['usuario', 'rolStaff'], // Para que en la presentación se vean los nombres y no solo IDs
    });
  }

  async findOne(id: number) {
    // 1. Buscamos el registro
    const staff = await this.perfilStaffRepository.findOne({
      where: { id },
      relations: ['usuario', 'rolStaff'],
    });
    // 2. Si no existe, tiramos la excepción para que el 'remove' la capture
    if (!staff) {
      throw new NotFoundException(`No se encontró el perfil de staff con ID ${id}`);
    }

    return staff;
  }
  
  async remove(id: number) {
    // Ahora 'staff' será un objeto PerfilStaff, no un string
    const staff = await this.findOne(id); 
    
    await this.perfilStaffRepository.softRemove(staff);
    
    return { message: `El perfil de staff ha sido dado de baja correctamente.` };
  }

  async restore(id: number) {
    const staff = await this.perfilStaffRepository.findOne({
      where: { id },
      withDeleted: true 
    });

    if (!staff) {
      throw new NotFoundException(`No se encontró el perfil de staff con ID ${id}`);
    }

    if (!staff.eliminado_en) {
      throw new BadRequestException('El perfil de staff ya se encuentra activo.');
    }

    await this.perfilStaffRepository.recover(staff);

    return { message: `El perfil de staff ha sido reactivado exitosamente.` };
  }

   // + funciones de prensa para calendario y noticias 
   
}
