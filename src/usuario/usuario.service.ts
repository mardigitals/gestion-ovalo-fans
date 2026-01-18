import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    // Crea la instancia de la entidad con los datos del DTO
    const nuevoUsuario = this.usuarioRepository.create(createUsuarioDto);
    
    // Lo guarda en la tabla 'usuario' de MySQL
    return await this.usuarioRepository.save(nuevoUsuario);
  }

  async update(id: number, updateUsuarioDto: any) { // Usamos any por ahora para no trabarnos con el DTO de update
    await this.usuarioRepository.update(id, updateUsuarioDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const usuario = await this.findOne(id);
    
    if (!usuario) {
      throw new Error(`Usuario con id ${id} no encontrado`);
    }

    // Usamos softRemove para que TypeORM llene la columna 'eliminado_en'
    // sin borrar el registro de la base de datos
    await this.usuarioRepository.softRemove(usuario);
    
    return { message: `Usuario con id ${id} dado de baja (lógica) correctamente` };
  }

  findAll() {
    return this.usuarioRepository.find();
  }

  findOne(id: number) {
    return this.usuarioRepository.findOneBy({ id });
  }
}