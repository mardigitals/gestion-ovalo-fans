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
        
        let nivelUsuario = 3; // Arrancamos asumiendo que es Público (Nivel 3)

        if (authHeader) {
            try {
                // 1. Abrimos el Token (Token JWT)
                const token = authHeader.split(' ')[1];
                const payload = this.jwtService.verify(token); // Valida que no esté vencido
                
                // Extraemos el rol del token (si existe)
                const userRole = payload.rol?.toLowerCase() || '';

                // ---  LÓGICA DE VALIDACIÓN ROL STAFF ---

                // ¿ES DEL STAFF? ( Autoridades pasan gratis)
                if (['superadmin', 'administrativo', 'prensa'].includes(userRole)) {
                    nivelUsuario = 1; // Le damos nivel P1 para que vea TODO sin censura
                } 
                // ES UN FAN: Verificamos si tiene la cuota al día (o en 72hs de gracia)
                else {
                    const tieneAcceso = await this.suscripcionService.validarAccesoFan(payload.userId);

                    if (tieneAcceso) {
                        // 3. Solo si tiene acceso válido, buscamos si es P1 o P2
                        nivelUsuario = await this.suscripcionService.obtenerNivelParaCensura(payload.userId);
                    } else {
                        // Si debe plata o está vencido, se queda en Nivel 3 (Censurado)
                        nivelUsuario = 3; 
                    }
                }

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

       // Evaluamos qué nivel pide el contenido
        switch (item.nivel_acceso_requerido) {
            
            case null:
            case 0:
                // Si en la BD es NULL o es 0, es PÚBLICO. 
                // Lo ve cualquiera (incluso los no logueados o P3).
                mostrarContenido = true;
                break;

            case 1:
                // Si el contenido pide nivel 1 (Exclusivo VIP), 
                // solo lo ven los que tienen membresía 1 (P1) o 2 (P2).
                if (membresiaIdUsuario === 1 || membresiaIdUsuario === 2) {
                    mostrarContenido = true;
                }
                break;

            default:
                // Por seguridad, si llega un número raro (ej: 5, 99), bloqueamos.
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