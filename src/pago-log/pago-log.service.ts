import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoLog } from './entities/pago-log.entity';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';
import { MercadoPagoConfig, Payment, Preference} from 'mercadopago';

@Injectable()
export class PagoLogService {
  private readonly logger = new Logger(PagoLogService.name);
  private readonly mpClient: MercadoPagoConfig;

  constructor(
    @InjectRepository(PagoLog)
    private readonly pagoLogRepository: Repository<PagoLog>,
    private readonly suscripcionService: SuscripcionService,
  ) {
    // INICIALIZAMOS MERCADO PAGO
    // ¡Ojo! En producción, este token tiene que venir de tus variables de entorno (.env)
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
        
        // 🚨 EL SECRETO: Cuando crees el link de pago en MP, tenés que mandarle el ID de tu suscripción 
        // adentro de la propiedad 'external_reference'. Así sabemos a quién le corresponde esta plata.
        const suscripcionId = Number(pagoReal.external_reference);

        if (!suscripcionId || isNaN(suscripcionId)) {
          this.logger.error(`El pago ${idPagoMp} no tiene un external_reference válido.`);
          return;
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

  /**
   * GENERAR LINK DE PAGO (Checkout Pro de Mercado Pago)
   */
  async generarLinkDePago(suscripcionId: number) {
    // 1. Buscamos los datos reales en nuestra base de datos para que no nos hackeen el precio
    const suscripcion = await this.suscripcionService.obtenerPorId(suscripcionId);

    try {
      const preference = new Preference(this.mpClient);

      // 2. Armamos la orden de cobro
      const response = await preference.create({
        body: {
          items: [
            {
              id: suscripcion.membresia.id.toString(),
              title: `Membresía ${suscripcion.membresia.nombre} - Autódromo Rafaela`,
              quantity: 1,
              // Nota: Acá uso el precio_mensual. Si tenés lógica de anual, lo ajustás acá.
              unit_price: Number(suscripcion.membresia.precio_mensual), 
              currency_id: 'ARS',
            }
          ],
          // 🚨 LA MAGIA: Le mandamos el ID de la suscripción para que vuelva en el Webhook
          external_reference: suscripcion.id.toString(), 
          
          // 3. ¿A dónde mandamos al fan cuando termina de pagar? (URLs de tu Frontend)
          back_urls: {
            success: 'http://localhost:5173/pago/exito', // Cambialo por la URL de tu frontend React
            failure: 'http://localhost:5173/pago/error',
            pending: 'http://localhost:5173/pago/pendiente'
          },
          auto_return: 'approved',
        }
      });

      this.logger.log(`Link generado para suscripción #${suscripcionId} - Preferencia: ${response.id}`);

      // 4. Devolvemos el link mágico
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
}