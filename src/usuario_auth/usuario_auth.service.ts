import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAuth } from './entities/usuario_auth.entity';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'; 
import { LoginDto } from './dto/login.dto'; 
import * as crypto from 'crypto';
import { MoreThan } from 'typeorm';
import { ResetPasswordDto } from './dto/reset-password.dto';



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

  async forgotPassword(email: string) {
    // 1. Verificar si el usuario existe
    const usuario = await this.usuarioAuthRepository.findOneBy({ email });

    if (!usuario) {
      throw new NotFoundException('No se encontró un usuario con ese correo electrónico.');
    }

    // 2. Generar un token aleatorio seguro de 64 caracteres
    const token = crypto.randomBytes(32).toString('hex');

    // 3. Definir la expiración (ejemplo: 15 minutos desde ahora)
    const tiempoExpiracion = new Date();
    tiempoExpiracion.setMinutes(tiempoExpiracion.getMinutes() + 15);

    // 4. Guardar en los campos que ya tienes en la tabla
    usuario.token_recuperacion = token;
    usuario.token_expiracion = tiempoExpiracion;

    await this.usuarioAuthRepository.save(usuario);

    // 5. En el futuro aquí enviaremos el mail con NodeMailer. 
    // Por ahora lo devolvemos para testear en Postman.
    return {
      message: 'Se ha generado un token de recuperación (válido por 15 min).',
      token: token // <--- Esto lo copiamos para el siguiente paso en Postman
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, nuevaContrasena } = resetPasswordDto;

    // 1. Buscar al usuario que tenga ese token Y que no haya expirado aún
    const usuario = await this.usuarioAuthRepository.findOne({
      where: { 
        token_recuperacion: token,
        token_expiracion: MoreThan(new Date()) 
      }
    });

    if (!usuario) {
      throw new BadRequestException('El token es inválido o ha expirado.');
    }

    // 2. Hashear la nueva contraseña (la que validamos con la Regex fuerte)
    const salt = await bcrypt.genSalt(10);
    usuario.contrasena_hash = await bcrypt.hash(nuevaContrasena, salt);

    // 3. ¡MUY IMPORTANTE!: Limpiar el token para que no se pueda usar de nuevo
    usuario.token_recuperacion = null;
    usuario.token_expiracion = null;

    await this.usuarioAuthRepository.save(usuario);

    return { message: 'Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.' };
  }
}

  







