import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { UseGuards } from '@nestjs/common';


@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('perfil-staff')
export class PerfilStaffController {
  constructor(private readonly perfilStaffService: PerfilStaffService) {}
  
  @Post('admin')
  @Roles('SuperAdmin') // Solo el SuperAdmin puede dar de alta staff
  create(@Body() createPerfilStaffDto: CreatePerfilStaffDto) {
    return this.perfilStaffService.create(createPerfilStaffDto);
  }
  
  @Get('admin')
  @Roles('SuperAdmin') 
  findAll() {
    return this.perfilStaffService.findAll();
  }

  @Get('admin/:id')
  @Roles('SuperAdmin') // Solo SuperAdmin ve perfiles individuales completos
  findOne(@Param('id') id: string) {
    return this.perfilStaffService.findOne(+id);
  }

  
  @Patch('admin/:id')
  @Roles('SuperAdmin') 
  update(@Param('id') id: string, @Body() updatePerfilStaffDto: UpdatePerfilStaffDto) {
    return this.perfilStaffService.update(+id, updatePerfilStaffDto);
  }

  @Delete('admin/:id')
  @Roles('SuperAdmin') 
  remove(@Param('id') id: string) {
    return this.perfilStaffService.remove(+id);
  }

  @Get(':id')
  @Roles('SuperAdmin', 'Administrativo', 'Prensa') // Todos los niveles de staff pueden ver por perfiles con datos principales
  findOneFiltrado(@Param('id') id: string) {
    return this.perfilStaffService.findOneFiltrado(+id); // El método con filtros por seguridad
  }

  // + funciones de prensa para calendario y noticias 
}



 
