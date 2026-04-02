import { Controller, Get, Post, Body, UseGuards, Req, Patch, Query, Param } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { GetUsosFilterDto } from './dto/get-usos-filter.dto';

@Controller('uso-beneficio')
export class UsoBeneficioController {
  constructor(private readonly usoBeneficioService: UsoBeneficioService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async registrar(@Body() createDto: CreateUsoBeneficioDto, @Req() req: any) {
    // Extraemos el ID del usuario del Token (inyectado por Passport en req.user)
    const usuarioAuthId = req.user.userId; 
    
    return await this.usoBeneficioService.registrarUso(createDto, usuarioAuthId);
  }

  /**
   * NOTA: Más adelante agregaremos aquí los métodos para el Staff:
   * - GET /uso-beneficio (Listar solicitudes para gestión)
   * - PATCH /uso-beneficio/:id (Aprobar/Rechazar)
   */

  // Trae todas las solicitudes 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrativo', 'SuperAdmin')
  @Get()
 async listarSolicitudes(@Query() filtros: GetUsosFilterDto) {
    return await this.usoBeneficioService.obtenerTodosParaGestion(filtros);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Administrativo', 'SuperAdmin')
  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
    @Body('notas_staff') notasStaff?: string,
  ) {
    return await this.usoBeneficioService.cambiarEstado(+id, estado, notasStaff);
  }
}


