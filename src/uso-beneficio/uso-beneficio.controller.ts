import { Controller, Get, Post, Body, UseGuards, Req, Patch, Query, Param } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { GetUsosFilterDto } from './dto/get-usos-filter.dto';
import { SuscripcionGuard } from 'src/usuario_auth/guards/suscripcion.guards';

@Controller('uso-beneficio')
export class UsoBeneficioController {
  constructor(private readonly usoBeneficioService: UsoBeneficioService) {}

  @UseGuards(JwtAuthGuard, SuscripcionGuard)
  @Post()
  async registrar(@Body() createDto: CreateUsoBeneficioDto, @Req() req: any) {
    // Extraemos el ID del usuario del Token (inyectado por Passport en req.user)
    const usuarioAuthId = req.user.userId; 
    
    return await this.usoBeneficioService.registrarUso(createDto, usuarioAuthId);
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('mis-usos')
  async misBeneficios(@Req() req: any) {
    const usuarioAuthId = req.user.userId;
    // Asumo que tenés un método similar en tu service. Si no, crealo para que busque por usuario.
    return await this.usoBeneficioService.obtenerUsosPorUsuario(usuarioAuthId); 
  }
}


