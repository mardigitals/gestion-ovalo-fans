import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerfilStaff } from './entities/perfil-staff.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service'; // Ajustá la ruta según la estructura de tu proyecto
import { UsuarioAuth } from 'src/usuario_auth/entities/usuario_auth.entity';

@Injectable()
export class PerfilStaffService {
  constructor(
    @InjectRepository(PerfilStaff)
    private readonly perfilStaffRepository: Repository<PerfilStaff>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(UsuarioAuth) // 🔥 AGREGAMOS EL REPO DE AUTH
    private readonly usuarioAuthRepository: Repository<UsuarioAuth>,
    private readonly mailService: MailService, 
  ) {}

  async create(createPerfilStaffDto: CreatePerfilStaffDto) {
    const { nombre, apellido, email, rol_staff_id, area, cargo } = createPerfilStaffDto;

    // 1. Validar que el email no exista previamente en UsuarioAuth
    const authExistente = await this.usuarioAuthRepository.findOne({ where: { email } });
    if (authExistente) {
      throw new BadRequestException('Ya existe una cuenta registrada con este correo electrónico.');
    }

    // 2. Generar contraseña temporal y hashearla (El campo en tu DB se llama contrasena_hash)
    const passwordTemporal = Math.random().toString(36).slice(-8);
    const passwordHasheada = await bcrypt.hash(passwordTemporal, 10);

    // 3. PASO A: Crear registro de Login en UsuarioAuth
    const nuevoAuth = this.usuarioAuthRepository.create({
      email,
      contrasena_hash: passwordHasheada,
      estado_cuenta: 'Activo', // Lo dejamos activo para que pueda entrar de una
    });
    const authGuardado = await this.usuarioAuthRepository.save(nuevoAuth);

    // 4. PASO B: Crear registro de Datos Personales en Usuario
    // Generamos un DNI temporal único usando "TMP-" seguido de los últimos 8 números del timestamp actual
    const dniTemporal = `TMP-${Date.now().toString().slice(-8)}`;

    const nuevoUsuario = this.usuarioRepository.create({
      usuario_auth_id: authGuardado.id, 
      nombre,
      apellido,
      dni: dniTemporal, // 🔥 ACÁ ESTÁ LA MAGIA, ahora cada comodín es único
      fecha_nacimiento: new Date('1990-01-01'), 
      genero: 'Prefiero no decirlo', 
      telefono: '0000000000', // El teléfono no tiene restricción UNIQUE, así que este no pincha
      calle: 'A Completar',
      numero: '0',
      cp: '0000',
      ciudad: 'Rafaela',
      provincia: 'Santa Fe',
      nacionalidad: 'Argentina',
      pais: 'Argentina'
    });
    const usuarioGuardado = await this.usuarioRepository.save(nuevoUsuario);

    // 5. PASO C: Crear el Perfil de Staff
    const nuevoStaff = this.perfilStaffRepository.create({
      usuario_id: usuarioGuardado.id, // Vinculamos el ID del usuario
      rol_staff_id,
      area,
      cargo,
      fecha_ingreso: new Date(),
    });
    const staffGuardado = await this.perfilStaffRepository.save(nuevoStaff);

    // 6. ¡Magia del Correo!
    const asunto = '¡Bienvenido al equipo de Staff de Óvalo Fans!';
    const texto = `Hola ${nombre},\n\n`
      + `Has sido dado de alta oficialmente en el sistema de gestión del Autódromo Ciudad de Rafaela.\n\n`
      + `Tus credenciales de acceso son:\n`
      + `Usuario/Email: ${email}\n`
      + `Contraseña temporal: ${passwordTemporal}\n\n`
      + `Por razones de seguridad, te pedimos que al ingresar por primera vez vayas a tu perfil para cambiar esta contraseña y completar tus datos personales (DNI, Dirección, Teléfono).\n\n`
      + `¡Nos vemos en los boxes!`;

    try {
      await this.mailService.enviarCorreo(email, asunto, texto);
    } catch (error) {
      console.error('Alerta: El staff fue creado pero falló el envío de correo:', error);
    }

    return staffGuardado;
  }


  async update(id: number, updatePerfilStaffDto: UpdatePerfilStaffDto) {
    // 1. Verificamos que exista (lanza NotFoundException si no)
    await this.findOne(id);

    try {
      // 2. Extraemos solo los campos que pertenecen a la tabla perfil_staff
      // Esto evita errores SQL si el DTO trae el email o el nombre de casualidad
      const { rol_staff_id, area, cargo } = updatePerfilStaffDto;

      // 3. Ejecutamos el UPDATE directo en la base de datos
      await this.perfilStaffRepository.update(id, {
        rol_staff_id,
        area,
        cargo
      });
      
      // 4. Devolvemos el registro ya actualizado con sus nombres de rol nuevos
      return await this.findOne(id);

    } catch (error: any) {
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
  
  async findOneFiltrado(id: number) {
    // 1. Buscamos el registro
    const staff = await this.perfilStaffRepository.findOne({
      where: { id },
      relations: ['usuario', 'rolStaff'],
      select: {
      id: true,
      area: true,
      cargo: true,
      usuario: {
        id: true,
        nombre: true,   // Solo enviamos lo necesario
        apellido: true,
        // DNI, teléfono y dirección NO se incluyen aquí
      },
      rolStaff: {
        nombre_rol: true
      }
    }
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
