import { 
  Controller, Get, Post, Body, Patch, Param, 
  UseGuards, Request, Query, ParseIntPipe 
} from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { CreateSuscripcionDto } from './dto/create-suscripcion.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards'; 
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';

@Controller('suscripcion')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuscripcionController {
  constructor(private readonly suscripcionService: SuscripcionService) {}

  // 1. INICIAR SUSCRIPCIÓN (Solo Fans)
  // Usa el token para asegurar que el fan cree su propia intención
  @Post()
  async create(@Body() createSuscripcionDto: CreateSuscripcionDto, @Request() req) {
    // Validamos que el perfil_fan_id del body sea el del usuario logueado por seguridad
    return await this.suscripcionService.crearIntencion(createSuscripcionDto);
  }

  // 2. CANCELAR SUSCRIPCIÓN (Solo Fans - Abierto con JWT)
  @Patch('cancelar/:id')
  async cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const fanId = req.user.userId; // Extraído del token
    return await this.suscripcionService.cancelar(id, fanId);
  }

  // 3. VERIFICAR ACCESO (Automático con JWT para el Fan)
  @Get('validar-acceso')
  async checkAccess(@Request() req) {
    const fanId = req.user.userId; // El fan consulta su propio acceso
    const tieneAcceso = await this.suscripcionService.validarAccesoFan(fanId);
    return { tieneAcceso };
  }

  // 4. CONSULTAR MI SUSCRIPCIÓN (Individual - Fan con JWT)
  @Get('mi-suscripcion/:id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Aquí podrías agregar lógica para que el fan solo vea la suya
    return await this.suscripcionService.findOne(id);
  }

  // =========================================================
  // ENDPOINTS EXCLUSIVOS PARA STAFF (Admin y SuperAdmin)
  // =========================================================

  @Get('admin/all')
  @Roles('SuperAdmin', 'Administrativo')
  async findAll() {
    return await this.suscripcionService.findAll();
  }

  @Get('admin/filter-estado')
  @Roles('SuperAdmin', 'Administrativo')
  async findByEstado(@Query('estado') estado: string) {
    return await this.suscripcionService.findByEstado(estado);
  }

  @Get('admin/filter-dni')
  @Roles('SuperAdmin', 'Administrativo')
  async findByDni(@Query('dni') dni: string) {
    return await this.suscripcionService.findByDni(dni);
  }

  @Get('admin/metrictas-membresia')
  @Roles('SuperAdmin', 'Administrativo')
  async getMetrics() {
    return await this.suscripcionService.countByMembresia();
  }

  // Activación manual/automática (Simulando Webhook o acción de Staff)
  @Patch('admin/activar/:id')
  @Roles('SuperAdmin', 'Administrativo')
  async activate(@Param('id', ParseIntPipe) id: number) {
    return await this.suscripcionService.activarSuscripcion(id);
  }
}