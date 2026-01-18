import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.auth.guards'; 



@Controller('usuario-auth') // Esta es la ruta que usaremos: http://localhost:3000/usuario-auth
export class UsuarioAuthController {
  constructor(private readonly usuarioAuthService: UsuarioAuthService) {}

  @Post('register') 
  create(@Body() createUsuarioAuthDto: CreateUsuarioAuthDto) {
    return this.usuarioAuthService.create(createUsuarioAuthDto);
  }

  @Post('login') 
  login(@Body() loginDto: LoginDto) {
    return this.usuarioAuthService.login(loginDto);
  }

  // RUTA PROTEGIDA DE PRUEBA
  @UseGuards(JwtAuthGuard) // <-- ESTE es el candado
  @Get('perfil')
  obtenerPerfil(@Request() req) {
    // Si llegamos acá, el token es válido y los datos están en req.user
    return req.user;
  }
}