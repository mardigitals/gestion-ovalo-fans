import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';

@Controller('perfil-fan')
export class PerfilFanController {
  constructor(private readonly perfilFanService: PerfilFanService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPerfilFanDto: CreatePerfilFanDto, @Request() req) {
  
  const userId = req.user.userId;
  return this.perfilFanService.create(createPerfilFanDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo') // Solo el staff ve la lista completa
  findAll() {
    return this.perfilFanService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Cualquier logueado entra, pero el Service valida el ID
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.rol;

    // El Service se encargará de la lógica de "Es mi perfil O soy jefe"
    return this.perfilFanService.findOne(+id, userId, userRole);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Body() updatePerfilFanDto: UpdatePerfilFanDto, 
    @Request() req
  ) {
    // Usamos esto por si el token guarda "id" en vez de "userId"
    const userId = req.user.id || req.user.userId; 
    return this.perfilFanService.update(+id, updatePerfilFanDto, userId);
  }
}