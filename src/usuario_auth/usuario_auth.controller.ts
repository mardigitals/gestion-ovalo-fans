import { Controller, Post, Body, Get, UseGuards, Request, Delete, Patch } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.auth.guards'; 
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';



@Controller('usuario-auth')
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

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) { // Recibe el DTO completo
    return this.usuarioAuthService.forgotPassword(forgotPasswordDto.email);
  }


  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usuarioAuthService.resetPassword(resetPasswordDto);
  }

    // --- REACTIVACIÓN DE CUENTA (Público - usa Token) ---
  @Patch('restore-account')
  restore(@Body('token') token: string) {
    return this.usuarioAuthService.restore(token);
  }

  // --- AUTOGESTIÓN (Privado - requiere JWT) ---
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  remove(@Request() req) {
    return this.usuarioAuthService.remove(req.user.userId);
  }

  // RUTA PROTEGIDA DE PRUEBA
  @UseGuards(JwtAuthGuard) // <-- ESTE es el candado
  @Get('perfil')
  obtenerPerfil(@Request() req) {
    // Si llegamos acá, el token es válido y los datos están en req.user
    return req.user;
  }

}



  




