import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { UpdateUsuarioAuthDto } from './dto/update-usuario_auth.dto';

@Controller('usuario-auth')
export class UsuarioAuthController {
  constructor(private readonly usuarioAuthService: UsuarioAuthService) {}

  @Post()
  create(@Body() createUsuarioAuthDto: CreateUsuarioAuthDto) {
    return this.usuarioAuthService.create(createUsuarioAuthDto);
  }

  @Get()
  findAll() {
    return this.usuarioAuthService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuarioAuthService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioAuthDto: UpdateUsuarioAuthDto) {
    return this.usuarioAuthService.update(+id, updateUsuarioAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usuarioAuthService.remove(+id);
  }
}
