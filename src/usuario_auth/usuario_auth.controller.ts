import { Controller, Post, Body } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';

@Controller('usuario-auth') // Esta es la ruta que usaremos: http://localhost:3000/usuario-auth
export class UsuarioAuthController {
  constructor(private readonly usuarioAuthService: UsuarioAuthService) {}

  @Post('register') // La ruta final será POST /usuario-auth/register
  create(@Body() createUsuarioAuthDto: CreateUsuarioAuthDto) {
    return this.usuarioAuthService.create(createUsuarioAuthDto);
  }
}