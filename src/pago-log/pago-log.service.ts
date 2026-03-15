import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PagoLog } from './entities/pago-log.entity';

@Injectable()
export class PagoLogService {
  constructor(
    @InjectRepository(PagoLog)
    private readonly pagoLogRepository: Repository<PagoLog>,
  ) {}

  /**
   * 1. REGISTRAR PAGO (Uso interno / Webhook)
   * Esto se va a llamar automáticamente cuando Mercado Pago nos avise que cobró bien.
   */
  async registrarPago(suscripcionId: number, monto: number, metodoPago: string, idTransaccionMp: string) {
    const nuevoPago = this.pagoLogRepository.create({
      suscripcion_id: suscripcionId,
      monto: monto,
      metodo_pago: metodoPago,
      id_transaccion_mp: idTransaccionMp,
    });

    const pagoGuardado = await this.pagoLogRepository.save(nuevoPago);
    console.log(`[Pagos] Se registró un pago de $${monto} para la suscripción #${suscripcionId}`);
    
    return pagoGuardado;
  }

  /**
   * 2. HISTORIAL DE PAGOS POR SUSCRIPCIÓN (Para el panel de Admin)
   */
  async findBySuscripcion(suscripcionId: number) {
    return await this.pagoLogRepository.find({
      where: { suscripcion_id: suscripcionId },
      order: { fecha_pago: 'DESC' } 
    });
  }
}