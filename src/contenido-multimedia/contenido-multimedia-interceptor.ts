import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt'; // Para abrir el token
import { SuscripcionService } from 'src/suscripcion/suscripcion.service'; // Para cruzar las tablas

@Injectable()
export class CensuraVipInterceptor implements NestInterceptor {
  
  // Inyectamos las herramientas que necesitamos
  constructor(
    private readonly jwtService: JwtService,
    private readonly suscripcionService: SuscripcionService
  ) {}

    // Lo hacemos async para poder esperar a la Base de Datos
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        
        let nivelUsuario = 3; // Arrancamos asumiendo que es Público

        if (authHeader) {
            try {
                // 1. Abrimos el Token (Token JWT)
                const token = authHeader.split(' ')[1];
                const payload = this.jwtService.verify(token); // Valida que no esté vencido
                
                // 2. Vamos a la Base de Datos (Token -> Fan -> Suscripcion -> Membresia)
                nivelUsuario = await this.suscripcionService.obtenerNivelParaCensura(payload.userId);
                
            } catch (error) {
                // Si el token es inválido o expiró, no hacemos nada, queda en Nivel 3.
            }
        }

        // 3. Aplicamos la censura con el nivel REAL de la base de datos
        return next.handle().pipe(
        map(data => {
            if (Array.isArray(data)) {
            return data.map(item => this.aplicarEstrategiaCensura(item, nivelUsuario));
            }
            return this.aplicarEstrategiaCensura(data, nivelUsuario);
        }),
        );
    }

    private aplicarEstrategiaCensura(item: any, membresiaIdUsuario: number | null) {
        let mostrarContenido = false;

        // Evaluamos qué nivel pide el contenido para dejarnos verlo
        switch (item.nivel_acceso_requerido) {
        
            case null:
            case 3:
                // Si el contenido es null o 3, es PÚBLICO. 
                // Lo ve cualquiera (incluso los que no están logueados).
                mostrarContenido = true;
                break;

            case 2:
                // Si el contenido es 2 (Exclusivo P2), 
                // solo lo ven los que tienen membresía 1 (P1) o 2 (P2).
                if (membresiaIdUsuario === 1 || membresiaIdUsuario === 2) {
                mostrarContenido = true;
                }
                break;

            case 1:
                // Si el contenido es 1 (VIP P1), 
                // SOLAMENTE lo ven los que tienen membresía 1.
                if (membresiaIdUsuario === 1) {
                mostrarContenido = true;
                }
                break;

            default:
                // Por seguridad, si llega un número raro, bloqueamos.
                mostrarContenido = false;
                break;
        }

        // --- Aplicamos el filtro visual ---
        const itemCensurado = { ...item };

        if (!mostrarContenido) {
            itemCensurado.url_recurso = null; // Borramos la URL para que no la roben
            itemCensurado.acceso_denegado = true; // Le avisamos a React que ponga el Blur
            } else {
            itemCensurado.acceso_denegado = false;
        }

        return itemCensurado;
    }
}