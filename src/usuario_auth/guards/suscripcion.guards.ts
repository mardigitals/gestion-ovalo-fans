import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service'; 

@Injectable()
export class SuscripcionGuard implements CanActivate {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Esto viene de tu JwtAuthGuard

    if (!user) {
      return false; // Si no hay usuario, el JwtAuthGuard ya lo rebotó antes de todas formas
    }

    // 1. EL PASE VIP: Si el usuario es parte del Staff, no le cobramos entrada
    const rolesExcluidos = ['superadmin', 'administrativo', 'prensa'];
    if (user.rol && rolesExcluidos.includes(user.rol.toLowerCase())) {
      return true;
    }

    // 2. EL CONTROL DE PEAJE: Usamos tu excelente método de las 72hs de gracia
    // (Asegurate de que user.userId o user.id sea el nombre correcto que guardás en tu token JWT)
    const tieneAcceso = await this.suscripcionService.validarAccesoFan(user.userId);

    if (!tieneAcceso) {
      throw new ForbiddenException('Frenada en boxes: Tu suscripción no está activa o está vencida.');
    }

    return true; // ¡Luz verde!
  }
}