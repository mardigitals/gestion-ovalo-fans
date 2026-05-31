import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoLog } from './entities/pago-log.entity';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';
import { MercadoPagoConfig, Payment, Preference} from 'mercadopago';
import { UsuarioAuthService } from 'src/usuario_auth/usuario_auth.service';

@Injectable()
export class PagoLogService {
  private readonly logger = new Logger(PagoLogService.name);
  private readonly mpClient: MercadoPagoConfig;

  constructor(
    @InjectRepository(PagoLog)
    private readonly pagoLogRepository: Repository<PagoLog>,
    private readonly suscripcionService: SuscripcionService,
    private readonly usuarioAuthService: UsuarioAuthService,
  ) {
    // INICIALIZAMOS MERCADO PAGO
    this.mpClient = new MercadoPagoConfig({ 
      accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-TU_ACCESS_TOKEN_ACA', 
      options: { timeout: 5000 }
    });
  }

  /**
   * REGISTRO EN BASE DE DATOS LOCAL
   */
  async registrarPago(suscripcionId: number, monto: number, metodoPago: string, idTransaccionMp: string) {
    const nuevoPago = this.pagoLogRepository.create({
      suscripcion_id: suscripcionId,
      monto: monto,
      metodo_pago: metodoPago,
      id_transaccion_mp: idTransaccionMp,
    });
    return await this.pagoLogRepository.save(nuevoPago);
  }

  /**
   * PROCESADOR DE PAGOS REALES DESDE MP
   */
  async procesarNotificacionPago(idPagoMp: string | number) {
    try {
      const paymentInstance = new Payment(this.mpClient);
      
      // 1. Buscamos el pago real en los servidores de MP para evitar fraudes
      const pagoReal = await paymentInstance.get({ id: idPagoMp });

      // 2. Verificamos si realmente se aprobó
      if (pagoReal.status === 'approved') {
        
        // Cuando cree el link de pago en MP, tenés que mandarle el ID de tu suscripción 
        // adentro de la propiedad 'external_reference'. Así sabemos a quién le corresponde esta plata.
        const suscripcionId = Number(pagoReal.external_reference);

        if (!suscripcionId || isNaN(suscripcionId)) {
          this.logger.error(`El pago ${idPagoMp} no tiene un external_reference válido.`);
          return;
        }

        // 2.1 Verificamos que no hayamos procesado este pago antes (IMPORTANTE para evitar duplicados en avisos repetidos de MP)
       
        const pagoYaExiste = await this.pagoLogRepository.findOne({
            where: { id_transaccion_mp: String(pagoReal.id) }
        });

        if (pagoYaExiste) {
          this.logger.log(`⚠️ El pago MP #${pagoReal.id} ya fue procesado anteriormente. Ignorando duplicado.`);
          return; // Cortamos la ejecución acá para que no guarde ni active dos veces
        }

        const monto = pagoReal.transaction_amount ?? 0; 
        const metodoPago = pagoReal.payment_type_id || 'mercadopago'; 

        this.logger.log(`¡Pago Aprobado! Monto: $${monto} | Suscripción ID: ${suscripcionId}`);

        // 3. Guardamos la factura
        await this.registrarPago(
          suscripcionId,
          monto,
          metodoPago,
          String(pagoReal.id) 
        );

        // 4. Activamos al usuario en nuestra base
        await this.suscripcionService.activarSuscripcion(suscripcionId);
      } else {
        this.logger.log(`El pago ${idPagoMp} tiene estado: ${pagoReal.status}. No se activa nada.`);
      }

    } catch (error) {
      this.logger.error(`Error al consultar a Mercado Pago por el ID ${idPagoMp}:`, error);
      throw error;
    }
  }

  async findBySuscripcion(suscripcionId: number) {
    return await this.pagoLogRepository.find({
      where: { suscripcion_id: suscripcionId },
      order: { fecha_pago: 'DESC' }
    });
  }

  async findAll(pagina: number = 1, limite: number = 10) {
    const saltar = (pagina - 1) * limite;

    const [data, total] = await this.pagoLogRepository.findAndCount({
      relations: ['suscripcion', 'suscripcion.perfilFan', 'suscripcion.perfilFan.usuario'],
      take: limite,
      skip: saltar,
      order: { fecha_pago: 'DESC' }
    });

    return {
      data,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite)
    };
  }

  /**
   * GENERAR LINK DE PAGO (Checkout Pro de Mercado Pago)
   */
  async generarLinkDePago(suscripcionId: number, usuarioId: number) { 
    // 1. Buscamos los datos reales
    const suscripcion = await this.suscripcionService.obtenerPorId(suscripcionId);

    //  2. EL BLINDAJE ANTI-HACKERS 
    if (suscripcion.perfilFan.usuario_id !== usuarioId) {
      this.logger.warn(`Intento de fraude: Usuario ${usuarioId} intentó pagar suscripción ${suscripcionId}`);
      throw new ForbiddenException('No tienes permiso para gestionar esta suscripción.');
    }

    try {
      const preference = new Preference(this.mpClient);

      // 2. Armamos la orden de cobro
      const response = await preference.create({
        body: {
          items: [
            {
              id: suscripcion.membresia.id.toString(),
              title: `Membresía ${suscripcion.membresia.nombre} - Autodromo Rafaela`,
              quantity: 1,
              // Nota: Acá uso el precio_mensual. Si tenés lógica de anual, lo ajustás acá.
              unit_price: Number(suscripcion.membresia.precio_mensual), 
              currency_id: 'ARS',
            }
          ],
          // Le mandamos el ID de la suscripción para que vuelva en el Webhook
          external_reference: suscripcion.id.toString(), 
          
          // 3. ¿A dónde mandamos al fan cuando termina de pagar? (URLs de tu Frontend)
          back_urls: {
            success: 'http://localhost:5173/pago/exito', // Cambialo por la URL de tu frontend React
            failure: 'http://localhost:5173/pago/error',
            pending: 'http://localhost:5173/pago/pendiente'
          },
          // auto_return: 'approved',
          notification_url:'https://introductory-randa-hyaloid.ngrok-free.dev/pagos/webhook' // Cambialo por tu URL pública + ruta del webhook en tu controller
        }
      });

      this.logger.log(`Link generado para suscripción #${suscripcionId} - Preferencia: ${response.id}`);

      // 4. Devolvemos el link 
      return {
        id_preferencia: response.id,
        url_pago: response.init_point,         // Para usar en producción
        url_sandbox: response.sandbox_init_point // Para probar sin plata real
      };

    } catch (error) {
      this.logger.error('Error al generar el link de Mercado Pago', error);
      throw error;
    }
  }

  async obtenerMisUltimosPagos(userId: number) {
    return await this.pagoLogRepository.createQueryBuilder('pago')
      // 1. Unimos el pago con la suscripción
      .innerJoin('pago.suscripcion', 'suscripcion')
      // 2. Unimos la suscripción con el perfilFan
      .innerJoin('suscripcion.perfilFan', 'perfilFan')
      // 3. 🔥 EL FILTRO: Como PerfilFan ya tiene el usuario_id directo, filtramos acá
      .where('perfilFan.usuario_id = :userId', { userId: userId })
      // Ordenamos del más nuevo al más viejo
      .orderBy('pago.fecha_pago', 'DESC')
      // Solo el Top 5
      .take(5)
      .getMany();
  }

}