import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAuth } from './entities/usuario_auth.entity';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'; 
import { LoginDto } from './dto/login.dto'; 

@Injectable()
export class UsuarioAuthService {
  constructor(
    @InjectRepository(UsuarioAuth)
    private readonly usuarioAuthRepository: Repository<UsuarioAuth>,
    private jwtService: JwtService, // <--- Inyectamos  generador de tokens
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

  async login(loginDto: LoginDto) {
    const { email, contrasena } = loginDto;

    // 1. Buscamos al usuario (forzamos el select de la contraseña porque tiene select: false)
    const usuario = await this.usuarioAuthRepository.findOne({
      where: { email },
      select: ['id', 'email', 'contrasena_hash'] 
    });

    // 2. Si no existe, tiramos error de una
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Comparamos la clave que viene de Postman con el Hash de la DB
    const esValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

    if (!esValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Si todo está OK, preparamos el Payload (los datos del "pase VIP")
    const payload = { sub: usuario.id, email: usuario.email };

    // 5. Devolvemos el token firmado
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
  // Otros métodos (findAll, findOne, update, remove) pueden ser implementados aquí
}

  







