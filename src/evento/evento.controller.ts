import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';


@Controller('evento')
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Post()
  create(@Body() createEventoDto: CreateEventoDto) {
    return this.eventoService.create(createEventoDto);
  }

  @Get()
  findAll() {
    return this.eventoService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('tc-disponibles')
  async obtenerTcFuturos() {
    return await this.eventoService.obtenerEventosTCDisponibles();
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('SuperAdmin', 'Administrativo', 'Prensa')
  @Get('buscar')
  async buscarEvento(@Query('nombre') nombre: string) {
    if (!nombre) return this.eventoService.findAll();
    return this.eventoService.buscarPorNombre(nombre);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo', 'Prensa')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventoService.findOne(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventoDto: UpdateEventoDto) {
    return this.eventoService.update(+id, updateEventoDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventoService.remove(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Prensa', 'SuperAdmin')
  @Get('prensa/metricas/tipos-eventos')
  async getTiposEventos() {
    return this.eventoService.getMetricasTiposEventos();
  }

}
