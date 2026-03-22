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
import { Usuario } from 'src/usuario/entities/usuario.entity';


@Injectable()
export class UsuarioAuthService {
  constructor(
    @InjectRepository(UsuarioAuth)
    private readonly usuarioAuthRepository: Repository<UsuarioAuth>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

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

    // 1. Buscamos al usuario
    const usuario = await this.usuarioAuthRepository.findOne({
      where: { email },
      select: ['id', 'email', 'contrasena_hash', 'estado_cuenta'] // Necesitamos el hash para comparar
    });

    // 2. Validación de existencia
    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    //3. Verificar estado de la cuenta
    if (usuario.estado_cuenta === 'Bloqueado') {
      throw new UnauthorizedException('Tu cuenta ha sido suspendida por la administración del Autódromo.');
    }

    const usuarioConRol = await this.usuarioRepository.findOne({
      where: { usuario_auth_id: usuario.id },
      relations: ['perfilStaff', 'perfilStaff.rolStaff'],
    });

    // 4. Extraemos el nombre del rol (SuperAdmin, Prensa, etc.)
    // Si no tiene perfil de staff, le asignamos 'fan' por defecto
    const nombreRol = usuarioConRol?.perfilStaff?.rolStaff?.nombre_rol || 'fan';

      // 3. Comparamos la clave
      const esValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);

      if (!esValida) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

    
      // 4. Actualizamos el último login en la base de datos
      // usuario.ultimo_login = new Date(); 
      // await this.usuarioAuthRepository.save(usuario); 

      const payload = { 
        sub: usuario.id, 
        email: usuario.email, 
        rol: nombreRol, 
        userId: usuarioConRol?.id
    };

      // 6. Devolvemos el token (El usuario se lo lleva, vos guardaste la fecha en SQL)
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
  }

  async forgotPassword(email: string) {
    // 1. Verificar si el usuario existe
    const usuario = await this.usuarioAuthRepository.findOne({
      where: { email },
      withDeleted: true
    });

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

  const usuario = await this.usuarioAuthRepository.findOne({
    where: { 
      token_recuperacion: token,
      token_expiracion: MoreThan(new Date()) 
    },
    withDeleted: true 
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

  // SOLICITAR BAJA (El usuario desde su perfil)
  async remove (authId: number) {
    const auth = await this.usuarioAuthRepository.findOne({
      where: { id: authId },
      relations: ['usuario', 'usuario.perfilStaff'] // Traemos toda la cadena
    });

    if (!auth) throw new NotFoundException('Cuenta no encontrada');

    await this.usuarioAuthRepository.softRemove(auth); // Borra Auth -> Usuario -> Staff
    return { message: "Tu cuenta ha sido desactivada correctamente." };
  }

  // REACTIVAR CUENTA (con el token enviado por email)
  async restore(token: string) {
    
    const auth = await this.usuarioAuthRepository.findOne({
      where: { 
        token_recuperacion: token,
        token_expiracion: MoreThan(new Date()) 
      },
      withDeleted: true, // CLAVE: para encontrar al que está en la "papelera"
      relations: ['usuario', 'usuario.perfilStaff']
    });

    if (!auth) {
      throw new BadRequestException('El token de reactivación es inválido o ha expirado.');
    }

    // 2. Quitamos la marca de borrado de toda la cadena (Auth -> Usuario -> Staff)
    await this.usuarioAuthRepository.recover(auth);

    // 3. Limpiamos los campos del token para que no se use de nuevo
    auth.token_recuperacion = null;
    auth.token_expiracion = null;
    await this.usuarioAuthRepository.save(auth);

    return { message: "¡Cuenta reactivada! Ya puedes iniciar sesión normalmente." };
  }

  async suspendByAdmin (id: number) {
    const auth = await this.usuarioAuthRepository.findOneBy({ id });
    if (!auth) throw new NotFoundException('Usuario no encontrado');

    auth.estado_cuenta = 'Bloqueado';
    await this.usuarioAuthRepository.save(auth);

    return { message: `Cuenta con ID ${id} ha sido suspendida` };
  }

  // REANUDACIÓN (Acción del SuperAdmin)
  async restartByAdmin(id: number) {
    const auth = await this.usuarioAuthRepository.findOne({ 
      where: { id }, 
      withDeleted: true 
    });
    
    if (!auth) throw new NotFoundException('Usuario no encontrado');

    auth.estado_cuenta = 'Activo';
    
    // Si estaba borrado lógicamente, lo recuperamos también
    if (auth.eliminado_en) {
      await this.usuarioAuthRepository.recover(auth);
    } else {
      await this.usuarioAuthRepository.save(auth);
    }

    return { message: `La cuenta con ID ${id} ha sido reactivada.` };
  }

}

  







