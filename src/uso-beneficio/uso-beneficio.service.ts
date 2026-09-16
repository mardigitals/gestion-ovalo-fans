import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { Repository, Between, Not, In } from 'typeorm';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { UsoBeneficio } from './entities/uso-beneficio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Evento } from 'src/evento/entities/evento.entity';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { GetUsosFilterDto } from './dto/get-usos-filter.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UsoBeneficioService {

  constructor(
    @InjectRepository(UsoBeneficio)
    private readonly usoBeneficioRepository: Repository<UsoBeneficio>,
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    private readonly mailService: MailService,
  ) {}
 
  async registrarUso(dto: CreateUsoBeneficioDto, usuarioId: number) {
    const suscripcion = await this.suscripcionRepository.findOne({
      where: { 
        perfilFan: { usuario_id: usuarioId } 
      },
      relations: ['membresia', 'pagoLogs', 'perfilFan', 'perfilFan.usuario'] 
    });
    console.log('Suscripción encontrada:', suscripcion);
    if (!suscripcion) throw new NotFoundException('No tenés una suscripción vinculada.');

    // 2, 3 y 4: Validaciones (Estado, Jerarquía y Reglas Pro)
    if (suscripcion.estado !== 'Activo') throw new ForbiddenException('Suscripción no activa.');
    this.validarJerarquia(suscripcion.membresia.id, dto.tipo_beneficio);
    await this.aplicarReglasPro(suscripcion, dto);

    // 5. DETERMINAR ESTADO Y GUARDAR
    let estadoInicial = 'Pendiente'; 
    let categoriaBeneficioInicial = 'Solicitado'; 

    switch (dto.tipo_beneficio) {
      case 'FAST_ACCESS':
      case 'DESC_PRUEBAS':
      case 'DESC_RECITALES':
      case 'DESC_CARRERAS':
        estadoInicial = 'Completado';
        categoriaBeneficioInicial = 'Instantáneo QR';
        break;
      case 'MULTIMEDIA_VIP': 
        estadoInicial = 'Completado'; 
        categoriaBeneficioInicial = 'Automático';
        break;

      //VIP BOXES, PLACA, REGALO, PACECAR, SALA_PRENSA y VISITAS_GUIADAS
      // Caen en el por defecto (Pendiente / Solicitado)
      //DESC_COMERCIO no usa endpoint de uso, es un descuento que el comercio aplica directamente al validar la suscripción del fan en findSuscripcionbyDni, así que tampoco va a caer acá.
    }

    let codigoQrUnico: string | undefined = undefined;
    
    if (categoriaBeneficioInicial === 'Instantáneo QR') {
        codigoQrUnico = `${dto.tipo_beneficio}-${suscripcion.id}-${Date.now().toString().slice(-6)}`;
      }

    // PRIMERO GUARDAMOS
    const usoGrabado = await this.usoBeneficioRepository.save({
      ...dto,
      suscripcion_id: suscripcion.id,
      estado: estadoInicial,
      categoria_beneficio: categoriaBeneficioInicial,
      codigo_qr: codigoQrUnico, // <-- ACÁ GUARDAMOS EL CÓDIGO
      fecha_solicitud: new Date(),
      fecha_uso: estadoInicial === 'Completado' ? new Date() : undefined,
    });

    // SEGUNDO NOTIFICAMOS
    this.dispararNotificaciones(usoGrabado, suscripcion); 

    return usoGrabado;
  }

  //Patron Strategy? Para validar jerarquías de beneficios según el plan
  private validarJerarquia(nivel: number, tipo: string) {
    const beneficiosP1 = ['VIP_BOXES', 'SALA_PRENSA', 'PLACA_RECTA', 'PACECAR_RESCATE'];
    const beneficiosP2 = ['FAST_ACCESS', 'VISITAS_GUIADAS', 'REGALO_SUPERFAN', 'MULTIMEDIA_VIP'];
    const beneficiosP3 = ['DESC_PRUEBAS', 'DESC_CARRERAS', 'DESC_RECITALES', 'DESC_COMERCIOS'];

    if (beneficiosP1.includes(tipo) && nivel > 1) {
      throw new ForbiddenException('Beneficio exclusivo de miembros P1.');
    }
    if (beneficiosP2.includes(tipo) && nivel > 2) {
      throw new ForbiddenException('Este beneficio requiere plan P2 o superior.');
    }
    // REGLA P3: Solo ID 1, 2 o 3. 
    // Si por algún error un usuario con nivel "Fan sin suscripción" intenta entrar:
    if (beneficiosP3.includes(tipo) && nivel > 3) {
      throw new ForbiddenException('Necesitás una suscripción activa para usar este descuento.');
    }
  }

  private async aplicarReglasPro(suscripcion: any, dto: CreateUsoBeneficioDto) {
    const hoy = new Date();

    // --- REGLA P1: VIP BOXES (12 meses + 12 pagos y evento TC) ---
    if (dto.tipo_beneficio === 'VIP_BOXES') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 12);

      if (mesesAntiguedad < 12 || cantPagos < 12) {
        throw new BadRequestException(`Requerís 12 meses de antigüedad y 12 pagos en el último año. Tenés ${mesesAntiguedad} meses y ${cantPagos} pagos recientes.`);
      }

      if (!dto.evento_id) {
        throw new BadRequestException('Para solicitar VIP Boxes debés seleccionar el evento.');
      }

      const evento = await this.eventoRepository.findOne({
        where: { id: dto.evento_id } 
      });

      if (!evento) throw new NotFoundException('El evento seleccionado no existe.');

      if (evento.tipo_evento !== 'Carrera' || evento.categoria_carrera !== 'TC') {
        throw new ForbiddenException('Los VIP Boxes son exclusivos para las fechas de la categoría Turismo Carretera (TC).');
      }

      if (evento.fecha_evento.getFullYear() !== hoy.getFullYear()) {
         throw new ForbiddenException('Solo podés generar accesos para eventos del año en curso.');
      }

      const yaUsoVip = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'VIP_BOXES',
          estado: Not('Rechazado') 
        }
      });

      if (yaUsoVip > 0) {
        throw new BadRequestException('Ya utilizaste tu beneficio de VIP de Boxes único.');
      }
    }

    // --- REGLA P1: SALA DE PRENSA (1 vez al año) ---
    if (dto.tipo_beneficio === 'SALA_PRENSA') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 12);

      if (mesesAntiguedad < 12 || cantPagos < 12) {
        throw new BadRequestException(`Requerís 12 meses de antigüedad ininterrumpida. En los últimos 12 meses registramos ${cantPagos} pagos.`);
      }

      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDiaAnio = new Date(hoy.getFullYear(), 11, 31);

      const usosAnio = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'SALA_PRENSA',
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio),
          estado: Not('Rechazado')
        }
      });

      if (usosAnio >= 1) throw new BadRequestException('El uso de Sala de Prensa es 1 vez por año.');
    }

    // --- REGLA P1: NOMBRE EN PLACA (Al cumplir 1 año real y 12 pagos, Única vez) ---
    if (dto.tipo_beneficio === 'PLACA_RECTA') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 12);

      if (mesesAntiguedad < 12 || cantPagos < 12) {
        throw new BadRequestException(`Requerís 12 meses de antigüedad ininterrumpida. En los últimos 12 meses registramos ${cantPagos} pagos.`);
      }

      // 3. Verificamos que no la haya pedido nunca en la vida
      const yaTienePlaca = await this.usoBeneficioRepository.count({
        where: { 
            suscripcion_id: suscripcion.id, 
            tipo_beneficio: 'PLACA_RECTA',
            estado: Not('Rechazado') 
        }
      });

      if (yaTienePlaca > 0) {
        throw new BadRequestException('Tu nombre ya fue enviado a grabado de placa. Este beneficio es por única vez.');
      }
    }

    // --- REGLA P1: RESCATE DE PACE CAR 1 vez al año---
    if (dto.tipo_beneficio === 'PACECAR_RESCATE') {
      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDiaAnio = new Date(hoy.getFullYear(), 11, 31);
      
      const usosAnio = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'PACECAR_RESCATE',
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio),
          estado: Not('Rechazado')
        }
      });

      if (usosAnio >= 1) throw new BadRequestException('El beneficio de Pace Car es 1 vez por año.');
    }

    // --- REGLA P2: FAST ACCESS (1 vez solo para el TC) ---
    //generar qr en el front para mostrar fast access predio, con validacion de p2 o p1. evento tiene que ser TC. El qr se genera al instante

    if (dto.tipo_beneficio === 'FAST_ACCESS') {

      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      
      
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 2);

      if (mesesAntiguedad < 2 || cantPagos < 2) {
        throw new BadRequestException(`Requerís 2 meses de antigüedad ininterrumpida. En los últimos 2 meses registramos ${cantPagos} pagos.`);
      }
      
      if (!dto.evento_id) {
        throw new BadRequestException('Para generar el QR de Fast Access debés seleccionar el evento.');
      }

      const evento = await this.eventoRepository.findOne({
        where: { id: dto.evento_id } 
      });

      if (!evento) throw new NotFoundException('El evento seleccionado no existe.');

      if (evento.tipo_evento !== 'Carrera' || evento.categoria_carrera !== 'TC') {
        throw new ForbiddenException('El Fast Access es exclusivo para las fechas de la categoría Turismo Carretera (TC).');
      }

      if (evento.fecha_evento.getFullYear() !== hoy.getFullYear()) {
         throw new ForbiddenException('Solo podés generar accesos para eventos del año en curso.');
      }

      const yaTieneAcceso = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'FAST_ACCESS',
          evento_id: dto.evento_id,
          estado: Not('Rechazado')
        }
      });

      if (yaTieneAcceso > 0) {
        throw new BadRequestException('Ya tenés un código QR generado para este evento.');
      }
    }
 
    // ---  REGLA P2: REGALO SUPERFAN (1 vez al año) ---

    if (dto.tipo_beneficio === 'REGALO_SUPERFAN') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 12);

      if (mesesAntiguedad < 12 || cantPagos < 12) {
        throw new BadRequestException(`Requerís 12 meses de antigüedad ininterrumpida. En los últimos 12 meses registramos ${cantPagos} pagos.`);
      }

      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDiaAnio = new Date(hoy.getFullYear(), 11, 31);

      const yaRecibioEsteAnio = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'REGALO_SUPERFAN',
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio),
          estado: Not('Rechazado')
        }
      });

      if (yaRecibioEsteAnio > 0) throw new BadRequestException('Ya solicitaste tu regalo Superfan de este año.');
    }
      
    // --- REGLA P2: VISITAS GUIADAS (2 al año) ---
    if (dto.tipo_beneficio === 'VISITAS_GUIADAS') {
      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDiaAnio = new Date(hoy.getFullYear(), 11, 31);
      
      const usosAnio = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'VISITAS_GUIADAS',
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio),
          estado: Not('Rechazado')
        }
      });

      if (usosAnio >= 2) throw new BadRequestException('Cupo anual de visitas guiadas (2) agotado.');
    }

      // --- REGLA P3: CUPO PRUEBAS LIBRES (3 al mes) ---
    if (dto.tipo_beneficio === 'DESC_PRUEBAS') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = this.contarPagosRecientes(suscripcion.pagoLogs, 1);

      if (mesesAntiguedad < 1 || cantPagos < 1) {
        throw new BadRequestException(`Requerís 1 mes de antigüedad. En los últimos meses registramos ${cantPagos} pagos.`);
      }

      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      //no validamos tipo_evento='Pruebas' ya que en esta version las pruebas no las cargamos, solo se chequeay valida el cupo mensual. Si en el futuro se cargan las pruebas como eventos, ahí sí habría que agregar esa validación.

      const usosMes = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'DESC_PRUEBAS',
          fecha_solicitud: Between(primerDiaMes, ultimoDiaMes)
        }
      });

      if (usosMes >= 3) {
        throw new BadRequestException('Ya agotaste tus 3 cupos mensuales de pruebas libres.');
      }
    }

    // --- REGLA P3: DESCUENTO EN CARRERAS (1 por persona por evento) 
    if (dto.tipo_beneficio === 'DESC_CARRERAS') {
      
      if (!dto.evento_id) {
        throw new BadRequestException('Para este beneficio es necesario seleccionar una carrera (evento).');
      }

      const evento = await this.eventoRepository.findOne({
        where: { id: dto.evento_id } 
      });

      if (!evento) throw new NotFoundException('El evento seleccionado no existe.');

      if (evento.tipo_evento !== 'Carrera') {
        throw new ForbiddenException('Seleccione la categoría de evento correcta para este descuento.');
      }

      if (evento.fecha_evento.getFullYear() !== hoy.getFullYear()) {
         throw new ForbiddenException('Solo podés generar accesos para eventos del año en curso.');
      }

      const yaUsoEnEvento = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'DESC_CARRERAS',
          evento_id: dto.evento_id,
        }
      });

      if (yaUsoEnEvento > 0) {
        throw new BadRequestException('Ya solicitaste tu entrada con descuento para esta carrera.');
      }
    }

    // --- REGLA P3: DESCUENTO EN RECITALES (1 por persona por evento) ---
    if (dto.tipo_beneficio === 'DESC_RECITALES') {
      
      if (!dto.evento_id) {
        throw new BadRequestException('Para este beneficio es necesario seleccionar un recital (evento).');
      }

      const evento = await this.eventoRepository.findOne({
        where: { id: dto.evento_id } 
      });

      if (!evento) throw new NotFoundException('El evento seleccionado no existe.');

      if (evento.tipo_evento !== 'Recital') {
        throw new ForbiddenException('Seleccione la categoría de evento correcta para este descuento.');
      }

      const yaUsoEnRecital = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'DESC_RECITALES',
          evento_id: dto.evento_id,
        }
      });

      if (yaUsoEnRecital > 0) {
        throw new BadRequestException('Ya solicitaste tu entrada con descuento para este recital.');
      }
    }
  }

  //Patron Observer? Para cada beneficio que requiera acción
  // Al ESCALAR aplicar REFACTOR con Observer Event.emmit
  private async dispararNotificaciones(uso: UsoBeneficio, suscripcion: any) {
    const nombreFan = `${suscripcion.perfilFan.usuario.nombre} ${suscripcion.perfilFan.usuario.apellido}`;
    const dniFan = suscripcion.perfilFan.usuario.dni;
    
    // aca o en el .env
    const emailStaff = process.env.EMAIL_STAFF || 'autrafaela@gmail.com'; 

    switch (uso.tipo_beneficio) {
      case 'SALA_PRENSA':
      case 'PACECAR_RESCATE':
      case 'VISITAS_GUIADAS':
        await this.mailService.enviarCorreo(
          emailStaff,
          `🏁 Nueva Solicitud P1/P2: ${uso.tipo_beneficio}`,
          `El fan ${nombreFan} (DNI: ${dniFan}) solicitó utilizar su beneficio de ${uso.tipo_beneficio}.\n\nPor favor, revisar el panel de gestión para verificar disponibilidad y coordinar detalles con el usuario.`
        );
        break;

      case 'REGALO_SUPERFAN':
        await this.mailService.enviarCorreo(
          emailStaff,
          `🎁 Regalo Anual Superfan - ${nombreFan}`,
          `El fan ${nombreFan} (DNI: ${dniFan}) ha cumplido un año de antigüedad y solicitó su regalo Superfan.\n\nRevisar en el sistema los detalles del usuario para gestionar el envío o entrega en el Autódromo.`
        );
        break;

      case 'PLACA_RECTA':
        // Podés mandarle copia directa al proveedor si quisieras
        await this.mailService.enviarCorreo(
          emailStaff,
          `🏆 Nuevo Grabado de Placa: ${nombreFan}`,
          `¡Atención! Se ha aprobado un nuevo beneficio de grabado de placa en la recta principal para el socio vitalicio: ${nombreFan}.\n\nIniciar gestiones con el proveedor.`
        );
        break;
    }
  }

  private contarPagosRecientes(pagoLogs: any[], mesesHaciaAtras: number): number {
    // Si no hay array de pagos o está vacío, no pagó nunca.
    if (!pagoLogs || pagoLogs.length === 0) return 0;

    // Calculamos la fecha límite (Ej: Si hoy es 28/03/2026 y pido 12 meses, la fecha límite es 28/03/2025)
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - mesesHaciaAtras);

    return pagoLogs.filter(pago => {
      // Usamos fecha_pago porque vi que así se llama tu columna en pago-log.entity.ts
      const fechaDelPago = new Date(pago.fecha_pago); 
      
      // Solo contamos los pagos que sean más nuevos que nuestra fecha límite
      return fechaDelPago >= fechaLimite;
    }).length;
  }

  // =========================================================
  // MÉTODOS PARA EL PANEL DEL STAFF (GESTIÓN)
  // =========================================================

 async obtenerTodosParaGestion(filtros: GetUsosFilterDto) {
    const { pagina = 1, limite = 10 } = filtros; // Valores por defecto
    const saltar = (pagina - 1) * limite;
    // Armamos un objeto de filtro dinámico
    const whereRules: FindOptionsWhere<UsoBeneficio> = {};

    if (filtros.estado) {
      whereRules.estado = filtros.estado;
    }

    if (filtros.tipo_beneficio) {
      whereRules.tipo_beneficio = filtros.tipo_beneficio;
    }

    // Filtrar por DNI requiere navegar por las relaciones
    if (filtros.dni) {
      whereRules.suscripcion = {
        perfilFan: {
          usuario: {
            dni: filtros.dni
          }
        }
      };
    }

    // Filtrar por una fecha específica (busca todo lo que pasó en ese día)
    if (filtros.fecha) {
      // Asumimos que desde el front mandan '2026-04-02'
      const inicioDia = new Date(`${filtros.fecha}T00:00:00.000Z`);
      const finDia = new Date(`${filtros.fecha}T23:59:59.999Z`);
      
      whereRules.fecha_solicitud = Between(inicioDia, finDia);
    }

    const [solicitudes, total] = await this.usoBeneficioRepository.findAndCount({
      where: whereRules,
      relations: ['suscripcion', 'suscripcion.perfilFan', 'suscripcion.perfilFan.usuario', 'suscripcion.perfilFan.usuario.auth', 'evento'],
      order: { fecha_solicitud: 'DESC' }, 
      take: limite, // 👈 Paginación
      skip: saltar   // 👈 Paginación
    });

    // Peinamos los datos para devolver un JSON limpio y liviano al Frontend
   const dataLimpia = solicitudes.map(uso => ({
      id: uso.id,
      tipo_beneficio: uso.tipo_beneficio,
      categoria: uso.categoria_beneficio,
      estado: uso.estado,
      fecha_solicitud: uso.fecha_solicitud,
      fecha_uso: uso.fecha_uso,
      notas_staff: uso.notas_staff,
      // Aplanamos la data del usuario para que React no tenga que bucear en objetos anidados
      fan: {
        nombre_completo: `${uso.suscripcion.perfilFan.usuario.nombre} ${uso.suscripcion.perfilFan.usuario.apellido}`,
        dni: uso.suscripcion.perfilFan.usuario.dni,
        telefono: uso.suscripcion.perfilFan.usuario.telefono,
        alias: uso.suscripcion.perfilFan.alias,
        email: uso.suscripcion.perfilFan.usuario.auth?.email
      },
      // Si hay un evento asociado, mandamos solo lo básico
      evento: uso.evento ? {
        id: uso.evento.id,
        nombre: uso.evento.titulo,
        fecha: uso.evento.fecha_evento
      } : null
    }));

    return {
      data: dataLimpia,
      total,
      pagina,
      totalPaginas: Math.ceil(total / limite)
    };
  }
  

 async cambiarEstado(id: number, nuevoEstado: string, notas?: string, contactoCoordinador?: string, fechaUso?: string) {
    //  Traemos las relaciones profundas para poder sacar el email del usuario
    const uso = await this.usoBeneficioRepository.findOne({ 
      where: { id },
      relations: ['suscripcion', 'suscripcion.perfilFan', 'suscripcion.perfilFan.usuario', 'suscripcion.perfilFan.usuario.auth']
    });
    
    if (!uso) {
      throw new NotFoundException(`La solicitud #${id} no existe.`);
    }

    uso.estado = nuevoEstado;
    if (notas) uso.notas_staff = notas;
    if (contactoCoordinador) uso.contacto_coordinador = contactoCoordinador;
    
   if (nuevoEstado === 'Completado') {
      if (fechaUso) {
        uso.fecha_uso = new Date(fechaUso); // La que elige el admin en el modal
      } else if (!uso.fecha_uso) {
        uso.fecha_uso = new Date(); // Respaldo para automáticos
      }
    }

    const guardado = await this.usoBeneficioRepository.save(uso);

    const emailFan = uso.suscripcion.perfilFan.usuario.auth?.email;

    if (emailFan) {
      const nombreBeneficio = uso.tipo_beneficio.replace('_', ' ');

      if (nuevoEstado === 'Completado') {
        const mensajeExtra = notas ? `\n\n📌 Instrucciones del Staff: ${notas}` : '';
        const mensajeContacto = contactoCoordinador ? `\n📞 Coordinador asignado: ${contactoCoordinador}` : '';
        
        // 📅 Formateamos la fecha si existe para ponerla en el mail
        const fechaMail = uso.fecha_uso.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' });
        const mensajeFecha = `\n📅 Fecha y hora programada: ${fechaMail}`;
        
        await this.mailService.enviarCorreo(
          emailFan,
          `✅ Solicitud Aprobada: ${nombreBeneficio}`,
          `¡Hola! Tu solicitud para el beneficio de ${nombreBeneficio} fue aprobada y coordinada.${mensajeFecha}${mensajeExtra}${mensajeContacto}\n\nPodés ver los detalles en tu Billetera de Óvalo Fans.`
        );
      } else if (nuevoEstado === 'Rechazado') {
        await this.mailService.enviarCorreo(
          emailFan,
          `❌ Actualización sobre tu solicitud: ${nombreBeneficio}`,
          `Hola. Tu solicitud no pudo ser procesada en esta ocasión.\nMotivo del Staff: ${notas || 'No cumple con los requisitos actuales.'}`
        );
      }
    }

    return guardado;
  }

  // NUEVO MÉTODO PARA LAS CARDS DEL FRONTEND
 async obtenerMetricasManuales() {
    // 1. Agregamos TODAS las categorías que queremos contar
    const categoriasTotales = [
      'VISITAS_GUIADAS', 'SALA_PRENSA', 'PACECAR_RESCATE', 'REGALO_SUPERFAN', 'PLACA_RECTA',
      'FAST_ACCESS', 'VIP_BOXES', 'DESC_PRUEBAS', 'DESC_RECITALES', 'DESC_CARRERAS'
    ];
    
    const metricas = await this.usoBeneficioRepository
      .createQueryBuilder('uso')
      .select('uso.tipo_beneficio', 'tipo')
      .addSelect('COUNT(uso.id)', 'cantidad')
      .where('uso.estado = :estado', { estado: 'Completado' })
      .andWhere('uso.tipo_beneficio IN (:...tipos)', { tipos: categoriasTotales })
      .groupBy('uso.tipo_beneficio')
      .getRawMany();

    return categoriasTotales.reduce((acc, tipo) => {
      const encontrada = metricas.find(m => m.tipo === tipo);
      acc[tipo] = encontrada ? Number(encontrada.cantidad) : 0;
      return acc;
    }, {});
  }

  obtenerUsosPorUsuario(usuarioId: number) {
    return this.usoBeneficioRepository.find({
      where: { suscripcion: { perfilFan: { usuario_id: usuarioId } } },
      relations: ['suscripcion', 'suscripcion.perfilFan', 'suscripcion.perfilFan.usuario', 'evento'],
      order: { fecha_solicitud: 'DESC' }
    });
  }

  async validarQrEscaneado(codigo: string) {
    const uso = await this.usoBeneficioRepository.findOne({
      where: { codigo_qr: codigo },
      relations: [
        'suscripcion', 
        'suscripcion.perfilFan', 
        'suscripcion.perfilFan.usuario',
        'evento'
      ]
    });

    if (!uso) {
      throw new NotFoundException('El voucher escaneado es inválido o no existe en el sistema.');
    }

    // Como es "Camino Pro", si quisieras que el código "se queme" o cambie de estado, 
    // podrías hacer un update acá (Ej: uso.estado = 'Usado').
    // Por ahora solo lo validamos y devolvemos la info al frontend.

    return uso;
  }
}
