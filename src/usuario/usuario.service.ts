import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      const nuevoUsuario = this.usuarioRepository.create(createUsuarioDto);
      return await this.usuarioRepository.save(nuevoUsuario);
    } catch (error) {
      // Error de MySQL para entradas duplicadas (ej: DNI repetido)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(`El DNI ${createUsuarioDto.dni} ya está registrado en Óvalo Fans.`);
      }
      // Error de Foreign Key (si el usuario_auth_id no existe)
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException('La cuenta proporcionada no es válida.');
      }
      throw new InternalServerErrorException('Error inesperado al crear el usuario. Intente más tarde.');
    }
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id); // Reutilizamos findOne para validar existencia

    try {
      // Object.assign mezcla los cambios del DTO sobre el objeto existente
      const usuarioActualizado = Object.assign(usuario, updateUsuarioDto);
      return await this.usuarioRepository.save(usuarioActualizado);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('El DNI ya pertenece a otro usuario registrado.');
      }
      throw new InternalServerErrorException('Error inesperado al actualizar el perfil. Intente más tarde.');
    }
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    
    // Usamos softRemove para que TypeORM llene la columna 'eliminado_en'
    // sin borrar el registro de la base de datos
    await this.usuarioRepository.softRemove(usuario);
    
    return { message: `El usuario ${usuario.nombre} ${usuario.apellido} ha sido dado de baja correctamente.` };
  }

  async restore(id: number) {
    // 1. Buscamos al usuario INCLUYENDO a los borrados (si no, findOne no lo vería)
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      withDeleted: true 
    });

    if (!usuario) {
      throw new NotFoundException(`No se encontró el usuario con ID ${id}`);
    }

    if (!usuario.eliminado_en) {
      throw new BadRequestException('El usuario ya se encuentra activo.');
    }

    // 2. Restauramos: esto vuelve a poner 'eliminado_en' en NULL
    await this.usuarioRepository.recover(usuario);

    return { 
      message: `El usuario ${usuario.nombre} ${usuario.apellido} ha sido reactivado exitosamente.` 
    };
}

  async findAll(query: { ciudad?: string; provincia?: string; activo?: string }) {
      const { ciudad, provincia, activo } = query;
      
      const where: any = {};

      if (ciudad) where.ciudad = ciudad;
      if (provincia) where.provincia = provincia;

      return await this.usuarioRepository.find({
        where,
        order: { apellido: 'ASC' },
        // Si activo viene como 'false', traemos también los borrados
        withDeleted: activo === 'false' ? true : false,
      });
    }

  async findOne(id: number) {
    const usuario = await this.usuarioRepository.findOneBy({ id });
    
    if (!usuario) {
      // Usamos la excepción de NestJS para un error 404 prolijo
      throw new NotFoundException(`No se encontró el usuario con ID ${id}`);
    }
    
    return usuario;
  }

  async findInactive() {
    // Retorna solo los usuarios que fueron dados de baja (con fecha en eliminado_en)
    return await this.usuarioRepository.find({
      withDeleted: true, // Esto le dice a TypeORM: "traé también los borrados"
      where: {
        eliminado_en: Not(IsNull()) // Solo los que efectivamente están borrados
      }
    });
  }

}