import { Controller, Post, Body, Res, HttpStatus, BadRequestException, UseGuards, Request } from '@nestjs/common';
import type { Response } from 'express';
import { PagoLogService } from './pago-log.service';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';



@Controller('pagos')
export class PagoLogController {
  constructor(private readonly pagoLogService: PagoLogService) {}

  /**
   * EL FRONTEND LLAMA ACÁ PARA OBTENER EL LINK DE PAGO
   * POST /pagos/generar-link
   */
  @Post('generar-link')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async crearLinkPago(@Body('suscripcion_id') suscripcionId: number, @Request() req) {
    if (!suscripcionId) {
      throw new BadRequestException('Debes enviar el suscripcion_id');
    }
    
    const authId = req.user.userId; // Sacamos el ID seguro del Token
    
    // Se lo pasamos al Service
    return await this.pagoLogService.generarLinkDePago(suscripcionId, authId); 
  }

  /**
   * WEBHOOK REAL PARA PRODUCCIÓN: Mercado Pago llama a esta ruta
   */
  @Post('webhook')
  async recibirWebhookMp(@Body() body: any, @Res() res: Response) {
    // 1."Protocolo http" MP exige que le respondamos 200 OK inmediatamente
    res.status(HttpStatus.OK).send();

    try {
      // 2. "Adapt Pattern" MP envía la info de diferentes formas según cómo lo configures (IPN o Webhook)
      const tipoEvento = body.type || body.topic || body.action;
      const idNotificacion = body.data?.id || body.resource;

      // 3. Solo nos importa si es un evento relacionado a un "payment" (pago)
      if ((tipoEvento === 'payment' || tipoEvento === 'payment.created' || tipoEvento === 'payment.updated') && idNotificacion) {
        
        console.log(`[Webhook] Aviso de MP recibido. Verificando ID: ${idNotificacion}`);
        
        // 4. Le pasamos el ID al Service para que consulte con la API de Mercado Pago
        await this.pagoLogService.procesarNotificacionPago(idNotificacion);
      }
    } catch (error) {
      console.error('[Webhook Error] Falló el procesamiento del pago:', (error as Error).message);
    }
  }
}