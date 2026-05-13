import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../usuario_auth/decorators/roles.decorators';
import { JwtAuthGuard } from '../usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from '../usuario_auth/guards/roles.guards';

@UseGuards(JwtAuthGuard)
@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUsuarioDto);
  }


  @Get()
  @UseGuards(RolesGuard)
  @Roles('SuperAdmin', 'Administrativo') 
  findAll(@Query() query: any) { // El decorador @Query captura los parámetros de la URL
    return this.usuarioService.findAll(query);
  }

 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(+id);
  }

  
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(+id, updateUsuarioDto);
  }

}
