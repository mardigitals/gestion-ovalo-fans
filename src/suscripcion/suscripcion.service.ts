import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Suscripcion } from './entities/suscripcion.entity';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { Membresia } from 'src/membresia/entities/membresia.entity';
import { verificarSocioAlDia } from 'src/common/mocks/padron-socios.mock';

@Injectable()
export class SuscripcionService {
  constructor(
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    
    @InjectRepository(Membresia)
    private readonly membresiaRepository: Repository<Membresia>,
  ) {}

  /**
   * 1. INICIAR SUSCRIPCIÓN O CAMBIO DE PLAN (Upgrade/Downgrade/Renovación Anticipada)
   */
  async crearIntencion(dto: CreateSuscripcionDto, usuarioId: number) {
    const perfil = await this.suscripcionRepository.manager.getRepository('PerfilFan').findOne({
      where: { usuario_id: usuarioId }
    });

    if (!perfil) throw new NotFoundException('No se encontró un perfil de Fan para este usuario.');

    // Buscamos si ya tiene una suscripción activa
    const activa = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id, estado: 'Activo' },
      relations: ['membresia']
    });

    // Validamos que el plan que quiere contratar exista
    const nuevaMembresia = await this.membresiaRepository.findOne({
      where: { id: dto.membresia_id }
    });
    
    if (!nuevaMembresia) throw new BadRequestException('El plan seleccionado no existe.');

    // 🔥 VALIDACIÓN DE PLAN ACTIVO (Renovación vs Upgrade/Downgrade)
    if (activa) {
      if (activa.membresia_id === dto.membresia_id) {
        const hoy = new Date();
        const fechaFin = new Date(activa.fecha_fin);
        const difDias = Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        // Si faltan más de 7 días, se bloquea la duplicación innecesaria
        if (difDias > 7) {
          throw new BadRequestException('Ya posees este plan activo actualmente.');
        }

        // Si faltan 7 días o menos: es una renovación manual anticipada permitida.
        // Avanza directamente al bloque de intención pendiente sin bloquearse.
      } else {
        // En tu BD: ID 1 es el más caro, ID 3 es el más barato.
        const isUpgrade = dto.membresia_id < activa.membresia_id;

        if (isUpgrade) {
          // CAMINO A - UPGRADE: Pasa a crear la intención 'Pendiente'.
        } else {
          // CAMINO B - DOWNGRADE: Pasa a crear la intención para programarse en la activación.
        }
      }
    }

    // Buscamos si ya tiene una intención pendiente para actualizarla (Blindaje Anti-Spam)
    const pendienteExistente = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id, estado: 'Pendiente' }
    });

    if (pendienteExistente) {
      pendienteExistente.membresia_id = dto.membresia_id;
      return await this.suscripcionRepository.save(pendienteExistente);
    }

    // Si no tenía nada pendiente, creamos la nueva intención
    const nueva = this.suscripcionRepository.create({
      membresia_id: dto.membresia_id,
      perfil_fan_id: perfil.id,
      estado: 'Pendiente',      
    });

    return await this.suscripcionRepository.save(nueva);
  }

  /**
   * 2. ACTIVACIÓN DE SUSCRIPCIÓN (Con manejo de Upgrade / Downgrade / Renovación)
   */
  async activarSuscripcion(id: number) {
    const suscripcionNueva = await this.suscripcionRepository.findOne({
      where: { id },
      relations: ['membresia', 'perfilFan']
    });

    if (!suscripcionNueva) throw new NotFoundException('La suscripción no existe.');

    // Buscamos si el usuario ya tenía otra activa
    const suscripcionVieja = await this.suscripcionRepository.findOne({
      where: { 
        perfil_fan_id: suscripcionNueva.perfil_fan_id, 
        estado: 'Activo' 
      },
      order: { id: 'DESC' }
    });

    const ahora = new Date();
    let fechaInicio = ahora;
    let estadoNueva = 'Activo';

    if (suscripcionVieja && suscripcionVieja.id !== suscripcionNueva.id) {
      const esMismoPlan = suscripcionNueva.membresia_id === suscripcionVieja.membresia_id;

      if (esMismoPlan) {
        // 🔄 CAMINO RENOVACIÓN ANTICIPADA:
        // La suscripción actual se da por finalizada para evitar colisiones activas
        suscripcionVieja.estado = 'Cancelado';
        await this.suscripcionRepository.save(suscripcionVieja);

        // La nueva arranca donde terminaba la anterior para no descontarle días al socio
        const finVieja = new Date(suscripcionVieja.fecha_fin);
        fechaInicio = finVieja > ahora ? finVieja : ahora;
        estadoNueva = 'Activo';
      } else {
        const isUpgrade = suscripcionNueva.membresia_id < suscripcionVieja.membresia_id;

        if (isUpgrade) {
          // 🔥 CAMINO A: UPGRADE (Mayor valor)
          suscripcionVieja.estado = 'Cancelado';
          await this.suscripcionRepository.save(suscripcionVieja);
          
          fechaInicio = ahora;
          estadoNueva = 'Activo';
        } else {
          // ⏳ CAMINO B: DOWNGRADE (Menor valor)
          fechaInicio = new Date(suscripcionVieja.fecha_fin);
          estadoNueva = 'Pendiente'; 
        }
      }
    }

    // Calculamos la fecha de fin de la nueva
    const fechaFin = new Date(fechaInicio);
    if (suscripcionNueva.membresia.nombre.toLowerCase().includes('anual')) {
      fechaFin.setFullYear(fechaInicio.getFullYear() + 1);
    } else {
      fechaFin.setDate(fechaInicio.getDate() + 30); 
    }

    return await this.suscripcionRepository.save({
      ...suscripcionNueva,
      estado: estadoNueva,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }

  /**
   * 3. VALIDACIÓN DE ACCESO (Incluye 72hs de Gracia)
   * Verifica si el fan puede entrar al contenido exclusivo.
   */
  async validarAccesoFan(usuarioId: number): Promise<boolean> {
    // Buscamos la suscripción activa usando el ID de Auth (el 8 que ves en el debugger)
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        // busca el perfil que pertenece a ese usuario logueado
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' 
      },
      order: { fecha_fin: 'DESC' }
    });

    // Si no encuentra ninguna suscripción para ese usuario, acceso denegado
    if (!suscripcion) return false;

    const ahora = new Date();
    const limiteGracia = new Date(suscripcion.fecha_fin);
    limiteGracia.setHours(limiteGracia.getHours() + 72); 

    return ahora < limiteGracia;
  }

  /**
   * 4. PROCESO DE CICLO DE VIDA (Cron Job Diario a la medianoche)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async procesarCicloDeVidaSuscripciones() {
    console.log('[Cron] Iniciando procesamiento diario de suscripciones...');
    const hoy = new Date();

    // REGLA 1: Activo -> Vencido (Se pasó de las 72hs de gracia)
    const limiteVencimiento = new Date();
    limiteVencimiento.setHours(limiteVencimiento.getHours() - 72); 
    
    const resVencidos = await this.suscripcionRepository.update(
      { 
        estado: 'Activo', 
        fecha_fin: LessThan(limiteVencimiento) 
      },
      { estado: 'Vencido' }
    );

    // REGLA 2: Vencido -> Cancelado (Más de 30 días vencido)
    // Se pausa el débito y la cuenta queda congelada para no acumular deuda infinita
    const limiteCancelacion = new Date();
    limiteCancelacion.setDate(limiteCancelacion.getDate() - 30);

    const resCancelados = await this.suscripcionRepository.update(
      { 
        estado: 'Vencido', 
        fecha_fin: LessThan(limiteCancelacion) 
      },
      { estado: 'Cancelado' }
    );

    // REGLA 3: Pendiente -> Activo (Para los Downgrades diferidos)
    // Si un downgrade quedó programado y su fecha de inicio es hoy o ya pasó, lo activamos.
    const resDowngrades = await this.suscripcionRepository.update(
      {
        estado: 'Pendiente',
        fecha_inicio: LessThanOrEqual(hoy)
      },
      { estado: 'Activo' }
    );

    console.log(`[Cron] Resumen: ${resVencidos.affected} pasaron a Vencido | ${resCancelados.affected} pasaron a Cancelado | ${resDowngrades.affected} Downgrades activados.`);
  }

  /**
   * 5. CANCELACIÓN VOLUNTARIA
   */
  async cancelar(id: number, usuarioId: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
      id: id,
      perfilFan: { usuario_id: usuarioId } 
      }
   });
    
    if (!suscripcion) throw new BadRequestException('No se pudo cancelar la suscripción.');

    suscripcion.estado = 'Cancelado';
    return await this.suscripcionRepository.save(suscripcion);
  }

  /**
   * 6. OBTENER ESTADO PARA EL FRONTEND
   * Devuelve el string exacto del estado para manejar el PitStopOverlay y la Billetera
   */
  async obtenerEstadoParaFrontend(usuarioId: number): Promise<string> {
    const perfil = await this.suscripcionRepository.manager.getRepository('PerfilFan').findOne({
      where: { usuario_id: usuarioId }
    });

    if (!perfil) return 'Sin Suscripcion';

    // 🔥 CORRECCIÓN: 1. Primero buscamos si tiene una suscripción 'Activo' vigente.
    // Esto evita que un intento de pago 'Pendiente' oculte su membresía real.
    const suscripcionActiva = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id, estado: 'Activo' }
    });

    if (suscripcionActiva) {
      return 'Activo';
    }

    // 2. Si NO tiene una activa, buscamos la última fila para ver si está Pendiente, Vencida o Cancelada
    const ultimaSuscripcion = await this.suscripcionRepository.findOne({
      where: { perfil_fan_id: perfil.id },
      order: { id: 'DESC' }
    });

    return ultimaSuscripcion ? ultimaSuscripcion.estado : 'Sin Suscripcion';
  }

  async findAll(pagina: number = 1, limite: number = 10) {
    const saltar = (pagina - 1) * limite;

    const [data, total] = await this.suscripcionRepository.findAndCount({
      relations: ['perfilFan', 'membresia', 'perfilFan.usuario'],
      withDeleted: true, // Esto permite traer la suscripción aunque esté soft-deleted (eliminada)
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

  async findOne(usuarioId: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' // Siempre traemos la que está vigente
      },
      order: { id: 'DESC' }, // La más nueva por si acaso
      relations: ['membresia'] // Traemos los datos del plan (Precio, nombre, etc.)
    });

    if (!suscripcion) {
      throw new NotFoundException('No tienes ninguna suscripción activa actualmente.');
    }
    return suscripcion;
  }
  
  async findByEstado(estado: string) {
    return await this.suscripcionRepository.find({
      where: { estado },
      relations: ['perfilFan', 'membresia'],
      withDeleted: true, // Esto permite traer la suscripción aunque esté soft-deleted (eliminada) 
      order: { fecha_fin: 'DESC' }
    });
  }

  async findByDni(dni: string) {
    const resultado = await this.suscripcionRepository.find({
      // Relación profunda: Buscamos en el PerfilFan -> Usuario -> DNI
      where: { 
        perfilFan: { 
          usuario: { dni } 
        } 
      },
      relations: ['perfilFan', 'perfilFan.usuario', 'membresia'],
      withDeleted: true // Esto permite traer la suscripción aunque esté soft-deleted (eliminada) 
    })
    if (resultado.length === 0) throw new NotFoundException(`No hay suscripciones para el DNI ${dni}`);
    return resultado;
  }

  async countBySuscripcion() {
    // Usamos un query builder para contar eficientemente agrupado por estado
    return await this.suscripcionRepository
      .createQueryBuilder('suscripcion')
      .select('suscripcion.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('suscripcion.estado')
      .getRawMany();

    // Esto devuelve algo como: [{ estado: 'Activo', cantidad: '5' }, { estado: 'Pendiente', cantidad: '10' }, ...]
  }

  async countByMembresia() {
    return await this.suscripcionRepository
      .createQueryBuilder('suscripcion')
      .select('membresia.nombre', 'plan')
      .addSelect('COUNT(suscripcion.id)', 'cantidad')
      .innerJoin('suscripcion.membresia', 'membresia')
      .groupBy('membresia.id')
      .getRawMany();
  }

  async countByChicanaFavorita() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan')
      .createQueryBuilder('perfil')
      .select('perfil.chicana_favorita', 'chicana')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('perfil.chicana_favorita')
      .getRawMany();
  }

  async countByCiudad() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan') 
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario') 
      .select('usuario.ciudad', 'ciudad')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('usuario.ciudad')
      .orderBy('cantidad', 'DESC')
      .getRawMany();
  }

  async countByProvincia() {
    return await this.suscripcionRepository.manager
      .getRepository('PerfilFan') 
      .createQueryBuilder('perfil')
      .innerJoin('perfil.usuario', 'usuario') 
      .select('usuario.provincia', 'provincia')
      .addSelect('COUNT(perfil.id)', 'cantidad')
      .groupBy('usuario.provincia')
      .orderBy('cantidad', 'DESC')
      .getRawMany();
  }

  async countByRetencion() {
    // Altas por mes (año actual)
    const altasRaw = await this.suscripcionRepository.query(`
      SELECT MONTH(fecha_inicio) as mes, COUNT(*) as cantidad 
      FROM suscripcion 
      WHERE YEAR(fecha_inicio) = YEAR(CURDATE()) 
      GROUP BY mes
    `);

    // Bajas por mes (año actual)
    const bajasRaw = await this.suscripcionRepository.query(`
      SELECT MONTH(fecha_fin) as mes, COUNT(*) as cantidad 
      FROM suscripcion 
      WHERE YEAR(fecha_fin) = YEAR(CURDATE()) AND estado IN ('Cancelado', 'Vencido') 
      GROUP BY mes
    `);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Mapeamos los 12 meses combinando las altas y bajas
    return meses.map((mes, index) => {
      const mesNum = index + 1;
      return {
        name: mes,
        altas: Number(altasRaw.find((a: any) => Number(a.mes) === mesNum)?.cantidad || 0),
        bajas: Number(bajasRaw.find((b: any) => Number(b.mes) === mesNum)?.cantidad || 0)
      };
    });
  }

  async getTopSociosAntiguos() {
    // Buscamos las 5 suscripciones activas más viejas y viajamos por todas las relaciones
    const suscripciones = await this.suscripcionRepository.find({
      where: { estado: 'Activo' },
      relations: [
        'membresia',
        'perfilFan',
        'perfilFan.usuario',
        'perfilFan.usuario.auth', // Cambiá 'usuarioAuth' si la propiedad se llama distinto en tu entity Usuario
      ],
      withDeleted: true, // Esto permite traer la suscripción aunque esté soft-deleted (eliminada) 
      order: { fecha_inicio: 'ASC' }, // ASC = De la fecha más vieja a la más nueva
      take: 5,
    });

    // Formateamos la respuesta extrayendo los datos de cada tabla correspondiente
    return suscripciones.map(s => {
      const fechaInicio = new Date(s.fecha_inicio);
      const hoy = new Date();
      
      // Cálculo de diferencia en meses
      let mesesActivo = (hoy.getFullYear() - fechaInicio.getFullYear()) * 12 + (hoy.getMonth() - fechaInicio.getMonth());
      
      // Atajo para no escribir tanto
      const usuarioDatos = s.perfilFan?.usuario;
      
      return {
        id: s.id,
        nombre: usuarioDatos?.nombre || 'Socio',
        apellido: usuarioDatos?.apellido || 'Óvalo',
        email: usuarioDatos?.auth?.email || 'Sin email', // Agregado por si lo querés usar en el frontend
        plan: s.membresia?.nombre || 'Membresía',
        mesesActivo: mesesActivo > 0 ? mesesActivo : 1, 
      };
    });
  }

  async obtenerPorId(id: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { id },
      // 👇 Agregamos perfilFan y su usuario para saber de quién es
      relations: ['membresia', 'perfilFan', 'perfilFan.usuario'],
      withDeleted: true // Esto permite traer la suscripción aunque esté soft-deleted (eliminada) 
    });
    
    if (!suscripcion) {
      throw new NotFoundException(`No se encontró la suscripción con ID ${id}`);
    }
    
    return suscripcion;
  }

  async obtenerNivelParaCensura(usuarioId: number): Promise<number> {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        perfilFan: { usuario_id: usuarioId },
        estado: 'Activo' 
      },
    });

    // Si existe devolvemos el ID (1 o 2), si no, devolvemos 3 (Público)
    return suscripcion ? suscripcion.membresia_id : 3;
  }

  async eliminarSuscripcionPendiente(usuarioId: number) {
    // 1. Buscamos el perfil del fan
    const perfil = await this.suscripcionRepository.manager.getRepository('PerfilFan').findOne({
      where: { usuario_id: usuarioId }
    });

    if (!perfil) {
      throw new NotFoundException('Perfil de Fan no encontrado.');
    }

    // 2. Buscamos SI O SI la última suscripción que esté PENDIENTE
    const suscripcionPendiente = await this.suscripcionRepository.findOne({
      where: { 
        perfil_fan_id: perfil.id,
        estado: 'Pendiente' 
      },
      order: { id: 'DESC' }
    });

    // 3. Si no hay ninguna pendiente, no hacemos nada
    if (!suscripcionPendiente) {
      throw new NotFoundException('No tenés ninguna transacción pendiente para cancelar.');
    }

    // 4. Hacemos un HARD DELETE (Borrado físico). 
    // Como nunca pagó, no necesitamos mantener registro de este intento en la tabla.
    await this.suscripcionRepository.remove(suscripcionPendiente);

    return { 
      message: 'Operación cancelada exitosamente.',
      suscripcionEliminada: suscripcionPendiente.id
    };
  }

  /**
   * 🔄 CRONJOB DIARIO: 
   * 1. Controla vencimientos del día (renueva si está AL_DIA, pasa a Vencido si está MOROSO).
   * 2. Revisa socios con suscripción Vencida que hayan pagado fuera de término en el club para reactivarlos.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async controlarVencimientosYSociosClub() {
    const ahora = new Date();
    const pagoLogRepo = this.suscripcionRepository.manager.getRepository('PagoLog');

    // =========================================================================
    // ETAPA 1: Suscripciones ACTIVAS que acaban de llegar a su fecha_fin
    // =========================================================================
    const suscripcionesPorVencer = await this.suscripcionRepository.find({
      where: {
        estado: 'Activo',
        fecha_fin: LessThanOrEqual(ahora),
      },
      relations: ['perfilFan', 'perfilFan.usuario'],
    });

    for (const susc of suscripcionesPorVencer) {
      const perfil = susc.perfilFan;
      const dniUsuario = perfil?.usuario?.dni;

      // Si es socio del club con el plan P3 (ID 3)
      if (perfil?.es_socio_club && susc.membresia_id === 3 && dniUsuario) {
        const checkPadron = verificarSocioAlDia(dniUsuario);

        if (checkPadron.valido) {
          //  Sigue AL DÍA: Renovamos 30 días de corrido desde su fecha_fin anterior
          const nuevaFechaInicio = new Date(susc.fecha_fin);
          const nuevaFechaFin = new Date(nuevaFechaInicio);
          nuevaFechaFin.setDate(nuevaFechaInicio.getDate() + 30);

          susc.fecha_inicio = nuevaFechaInicio;
          susc.fecha_fin = nuevaFechaFin;
          susc.estado = 'Activo';
          await this.suscripcionRepository.save(susc);

          await pagoLogRepo.save(pagoLogRepo.create({
            suscripcion_id: susc.id,
            monto: 0,
            metodo_pago: 'convenio_socio_ar',
            id_transaccion_mp: `RENOV_AR_${dniUsuario}_${Date.now()}`,
          }));

          console.log(`[Cron Socio AR] Renovación P3 al día para DNI ${dniUsuario}`);
        } else {
          //  Pagó tarde o debe la cuota del club: pasa a 'Vencido' (NO le quitamos es_socio_club)
          // Así mañana el Cron vuelve a fijarse si ya regularizó en secretaría.
          susc.estado = 'Vencido';
          await this.suscripcionRepository.save(susc);

          console.log(`[Cron Socio AR] Socio DNI ${dniUsuario} en mora con el Club. Pasa a Vencido temporalmente.`);
        }
      } else {
        // Fan normal o socio con plan pago (P1/P2) que venció su mes
        susc.estado = 'Vencido';
        await this.suscripcionRepository.save(susc);
      }
    }

    // =========================================================================
    // ETAPA 2: Recuperación diaria de Socios AR que pagaron fuera de término
    // =========================================================================
    const suscripcionesVencidasSocios = await this.suscripcionRepository.find({
      where: {
        estado: 'Vencido',
        membresia_id: 3,
        perfilFan: { es_socio_club: true },
      },
      relations: ['perfilFan', 'perfilFan.usuario'],
    });

    for (const suscVencida of suscripcionesVencidasSocios) {
      const dniUsuario = suscVencida.perfilFan?.usuario?.dni;
      if (!dniUsuario) continue;

      const checkPadron = verificarSocioAlDia(dniUsuario);

      if (checkPadron.valido) {
        //  ¡Regularizó su cuota en el club! Reactivamos desde HOY por 30 días
        const nuevaFechaFin = new Date(ahora);
        nuevaFechaFin.setDate(ahora.getDate() + 30);

        suscVencida.fecha_inicio = ahora;
        suscVencida.fecha_fin = nuevaFechaFin;
        suscVencida.estado = 'Activo';
        await this.suscripcionRepository.save(suscVencida);

        await pagoLogRepo.save(pagoLogRepo.create({
          suscripcion_id: suscVencida.id,
          monto: 0,
          metodo_pago: 'convenio_socio_ar',
          id_transaccion_mp: `REACTIV_AR_${dniUsuario}_${Date.now()}`,
        }));

        console.log(`[Cron Socio AR] ¡Socio DNI ${dniUsuario} regularizó su cuota! P3 reactivado.`);
      }
    }
  }
}