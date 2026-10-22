import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';
import { PerfilFan } from './entities/perfil-fan.entity';
import { UsuarioAuth } from '../usuario_auth/entities/usuario_auth.entity';
import { PADRON_SOCIOS_AR, verificarSocioAlDia } from 'src/common/mocks/padron-socios.mock';

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

    // 1. Buscamos los datos del usuario recién creado para obtener su DNI
    const usuario = await this.perfilFanRepository.manager.getRepository('Usuario').findOne({
      where: { id: usuarioId }
    });

    if (!usuario) {
      throw new BadRequestException('Usuario base no encontrado.');
    }

    // 2. Verificamos si declaró ser socio contra el padrón del club
    let estadoInicialSuscripcion: 'Activo' | 'Vencido' | null = null;
    let esSocioEnPadron = false;
    let avisoSocio: string | null = null;

    if (createPerfilFanDto.es_socio_club) {
      const dniLimpio = usuario.dni.trim().replace(/\./g, '');
      const socioEncontrado = PADRON_SOCIOS_AR.find((s) => s.dni === dniLimpio);

      if (!socioEncontrado) {
        // No existe en el padrón del club
        esSocioEnPadron = false;
        avisoSocio = 'El DNI ingresado no figura en el padrón de socios de Atlético de Rafaela.';
      } else if (socioEncontrado.estado_cuota === 'AL_DIA') {
        // Socio al día -> Entra directo con P3 Activo
        esSocioEnPadron = true;
        estadoInicialSuscripcion = 'Activo';
      } else {
        // Socio MOROSO o BAJA -> Lo reconocemos como socio (es_socio_club = true),
        // pero su P3 nace 'Vencido' hasta que pague en el club (el Cron diario lo activará cuando pague)
        esSocioEnPadron = true;
        estadoInicialSuscripcion = 'Vencido';
        avisoSocio = `Figurás en el padrón del club como "${socioEncontrado.estado_cuota}". Cuando regularices tu cuota social se activará tu P3 gratis, o podés abonar un plan ahora.`;
      }
    }

    // 3. Creamos y guardamos el perfil del fan con el booleano validado
    const nuevoPerfil = this.perfilFanRepository.create({
      ...createPerfilFanDto,
      es_socio_club: esSocioEnPadron,
      usuario_id: usuarioId,
    });
    const perfilGuardado = await this.perfilFanRepository.save(nuevoPerfil);

    // 4. Activamos la cuenta en la tabla usuario_auth
    if (usuarioId && usuarioAuthId) {
      await this.usuarioAuthRepository.update(
        usuarioAuthId,
        { estado_cuenta: 'Activo' }
      );
    }

    // 5. Si está en el padrón del club, le creamos la suscripción Nivel P3 (ID 3)
    if (esSocioEnPadron && estadoInicialSuscripcion) {
      const ahora = new Date();
      const fechaFin = new Date(ahora);
      
      if (estadoInicialSuscripcion === 'Activo') {
        fechaFin.setDate(ahora.getDate() + 30);
      }

      const suscripcionRepo = this.perfilFanRepository.manager.getRepository('Suscripcion');
      const pagoLogRepo = this.perfilFanRepository.manager.getRepository('PagoLog');

      const suscripcionSocio = suscripcionRepo.create({
        perfil_fan_id: perfilGuardado.id,
        membresia_id: 3, // Nivel P3
        estado: estadoInicialSuscripcion, // 'Activo' si está al día, 'Vencido' si debe en el club
        fecha_inicio: ahora,
        fecha_fin: fechaFin,
      });

      const suscGuardada = await suscripcionRepo.save(suscripcionSocio);

      // Si entró 'Activo', dejamos asentado el comprobante $0 en pago_log
      if (estadoInicialSuscripcion === 'Activo') {
        await pagoLogRepo.save(pagoLogRepo.create({
          suscripcion_id: suscGuardada.id,
          monto: 0,
          metodo_pago: 'convenio_socio_ar',
          id_transaccion_mp: `SOCIO_AR_${usuario.dni}_${Date.now()}`,
        }));
      }
    }

    // 6. Retornamos el perfil junto con las banderas para el Frontend
    return {
      ...perfilGuardado,
      bonificado_socio_ar: estadoInicialSuscripcion === 'Activo',
      aviso_socio: avisoSocio,
    };
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