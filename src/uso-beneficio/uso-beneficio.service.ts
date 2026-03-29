import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { Repository, Between, Not, In } from 'typeorm';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { UsoBeneficio } from './entities/uso-beneficio.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Evento } from 'src/evento/entities/evento.entity';

@Injectable()
export class UsoBeneficioService {

  constructor(
    @InjectRepository(UsoBeneficio)
    private readonly usoBeneficioRepository: Repository<UsoBeneficio>,
    @InjectRepository(Suscripcion)
    private readonly suscripcionRepository: Repository<Suscripcion>,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
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
      case 'VIP_BOXES':
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

      // PLACA, REGALO, PACECAR, SALA_PRENSA y VISITAS_GUIADAS
      // Caen en el por defecto (Pendiente / Solicitado)
      //DESC_COMERCIO no usa endpoint de uso, es un descuento que el comercio aplica directamente al validar la suscripción del fan en findSuscripcionbyDni, así que tampoco va a caer acá.
    }

    // PRIMERO GUARDAMOS
    const usoGrabado = await this.usoBeneficioRepository.save({
      ...dto,
      suscripcion_id: suscripcion.id,
      estado: estadoInicial,
      categoria_beneficio: categoriaBeneficioInicial,
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

    // --- REGLA P1: VIP BOXES (6 meses + 6 pagos y evento TC) ---
    if (dto.tipo_beneficio === 'VIP_BOXES') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      const cantPagos = suscripcion.pagoLogs ? suscripcion.pagoLogs.length : 0;

      if (mesesAntiguedad < 6 || cantPagos < 6) {
        throw new BadRequestException(`Requerís 6 meses de antigüedad y 6 pagos. Tenés ${mesesAntiguedad} meses y ${cantPagos} pagos.`);
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
          estado: Not('Rechazado') // Si se lo rechazaron antes, puede volver a pedir.
        }
      });

      if (yaUsoVip > 0) {
        throw new BadRequestException('Ya utilizaste tu beneficio de VIP de Boxes único.');
      }
    }

    // --- REGLA P1: SALA DE PRENSA (1 vez al año) ---
    if (dto.tipo_beneficio === 'SALA_PRENSA') {
      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const ultimoDiaAnio = new Date(hoy.getFullYear(), 11, 31);

      const usosAnio = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'SALA_PRENSA',
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio)
        }
      });

      if (usosAnio >= 1) throw new BadRequestException('El uso de Sala de Prensa es 1 vez por año.');
    }

    // --- REGLA P1: NOMBRE EN PLACA (Al cumplir 1 año real y 12 pagos, Única vez) ---
    if (dto.tipo_beneficio === 'PLACA_RECTA') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());
      
      // 1. Contamos los pagos usando la relación que arreglamos antes
      const cantPagos = suscripcion.pagoLogs ? suscripcion.pagoLogs.length : 0;
      
      // 2. Candado doble: 12 meses Y 12 pagos
      if (mesesAntiguedad < 12 || cantPagos < 12) {
        throw new BadRequestException(`El grabado en placa requiere 12 meses de antigüedad y 12 cuotas pagas. Tenés ${mesesAntiguedad} meses y ${cantPagos} pagos.`);
      }

      // 3. Verificamos que no la haya pedido nunca en la vida (Opción A)
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

      const hoy = new Date();
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
 //reglas p2 a validar =============>>>>>>
    // ---  REGLA P2: REGALO SUPERFAN (1 vez al año) ---

    if (dto.tipo_beneficio === 'REGALO_SUPERFAN') {
      const inicio = new Date(suscripcion.fecha_inicio);
      const mesesAntiguedad = (hoy.getFullYear() - inicio.getFullYear()) * 12 + (hoy.getMonth() - inicio.getMonth());

      if (mesesAntiguedad < 12) {
        throw new BadRequestException('El regalo Superfan requiere 12 meses de antigüedad.');
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
          fecha_solicitud: Between(primerDiaAnio, ultimoDiaAnio)
        }
      });

      if (usosAnio >= 2) throw new BadRequestException('Cupo anual de visitas guiadas (2) agotado.');
    }

      // --- REGLA P3: CUPO PRUEBAS LIBRES (3 al mes) ---
    if (dto.tipo_beneficio === 'DESC_PRUEBAS') {
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

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

      const yaUsoEnEvento = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'DESC_CARRERAS',
          evento_id: dto.evento_id,
          estado: Not('Rechazado')
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

      const yaUsoEnRecital = await this.usoBeneficioRepository.count({
        where: {
          suscripcion_id: suscripcion.id,
          tipo_beneficio: 'DESC_RECITALES',
          evento_id: dto.evento_id,
          estado: Not('Rechazado')
        }
      });

      if (yaUsoEnRecital > 0) {
        throw new BadRequestException('Ya solicitaste tu entrada con descuento para este recital.');
      }
    }
  }

  //Patron Observer? Para cada beneficio que requiera acción
  private async dispararNotificaciones(uso: UsoBeneficio, suscripcion: any) {
    const nombreFan = `${suscripcion.perfilFan.usuario.nombre} ${suscripcion.perfilFan.usuario.apellido}`;

    switch (uso.tipo_beneficio) {
      case 'SALA_PRENSA':
      case 'PACECAR_RESCATE':
      case 'VISITAS_GUIADAS':
        // Llamamos a un servicio de Mail (que crearemos luego)
        // this.mailService.enviarAvisoStaff(uso.tipo_beneficio, nombreFan, suscripcion.perfilFan.usuario.dni);
        console.log(`📧 Mail enviado a Staff: El fan ${nombreFan} solicitó ${uso.tipo_beneficio}. Revisar disponibilidad y coordinar por WhatsApp.`);
        break;

      case 'REGALO_SUPERFAN':
        //Especial para el regalo superfan, quizás con más detalles para que el staff sepa qué gestionar
        console.log(`📧 Mail enviado a Staff: El fan ${nombreFan} cumplió un año. Debemos enviar su regalo Superfan. Revisar detalles para gestionar.`);
        break;

      case 'PLACA_RECTA':
        // Este es especial, quizás también un mail al proveedor de las placas o pintor
        console.log(`📧 Mail enviado a Staff: ¡Nuevo grabado de placa para ${nombreFan}!`);
        break;
    }
  }

}
