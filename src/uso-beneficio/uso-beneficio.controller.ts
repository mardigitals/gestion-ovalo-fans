import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';

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
}
