import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAuth } from './entities/usuario_auth.entity';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioAuthService {
  constructor(
    @InjectRepository(UsuarioAuth)
    private readonly usuarioAuthRepository: Repository<UsuarioAuth>,
  ) {}

  async create(createUsuarioAuthDto: CreateUsuarioAuthDto) {
    const { email, contrasena } = createUsuarioAuthDto;

    // 1. Verificar si el email ya existe
    const existeUsuario = await this.usuarioAuthRepository.findOne({ where: { email } });
    if (existeUsuario) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasena_hash = await bcrypt.hash(contrasena, salt);

    // 3. Crear la instancia de la entidad y guardar
    const nuevoUsuario = this.usuarioAuthRepository.create({
      email,
      contrasena_hash,
    });

    return await this.usuarioAuthRepository.save(nuevoUsuario);
  }

  // Otros métodos (findAll, findOne, update, remove) pueden ser implementados aquí
}