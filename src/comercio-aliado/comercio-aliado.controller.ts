import { Controller, Get, Param, Body, Post, Patch, Delete, UseGuards, Query } from '@nestjs/common';
import { ComercioAliadoService } from './comercio-aliado.service';
import { CreateComercioAliadoDto } from './dto/create-comercio-aliado.dto';
import { UpdateComercioAliadoDto } from './dto/update-comercio-aliado.dto';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';



@Controller('comercio-aliado')
export class ComercioAliadoController {
  constructor(private readonly comercioAliadoService: ComercioAliadoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Post()
  create(@Body() dto: CreateComercioAliadoDto) {
    return this.comercioAliadoService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdateComercioAliadoDto) {
    return this.comercioAliadoService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin','Administrativo') 
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.comercioAliadoService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Get('buscar') 
  async buscarComercio(@Query('nombre') nombre_comercio: string) {
    if (!nombre_comercio) {
      return this.comercioAliadoService.findAll(); // Si no mandan nombre, traemos todos
    }
    return this.comercioAliadoService.buscarPorNombre(nombre_comercio);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin','Administrativo') 
  @Get()
  findAll() {
    return this.comercioAliadoService.findAll();
  }

  @Get('validar-fan/:dni')
  validarFan(@Param('dni') dni: string) {
    return this.comercioAliadoService.validarFanParaDescuento(dni);
  }

}