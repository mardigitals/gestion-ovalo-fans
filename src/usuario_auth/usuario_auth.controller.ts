import { Controller, Post, Body, Get, UseGuards, Request, Delete, Patch, Param, Query } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.auth.guards'; 
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Roles } from './decorators/roles.decorators';
import { RolesGuard } from './guards/roles.guards';


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

  @UseGuards(JwtAuthGuard) // <-- ESTE es el candado
  @Get('perfil')
  async obtenerPerfil(@Request() req) {
    // 1. Agarramos los datos básicos que nos dejó el token
    const userId = req.user.id || req.user.userId;
    const rol = req.user.rol;

    // 2. Llamamos a nuestro Service para que busque el nivel exacto en la base de datos
    return await this.usuarioAuthService.obtenerDatosCompletos(userId, rol);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @Get('all')
  findAll(@Query('pagina') pagina: string) {
    const pageNumber = pagina ? Number(pagina) : 1; 
    return this.usuarioAuthService.findAll(pageNumber);
  }
  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @Patch(':id/suspend')
  suspendByAdmin(@Param('id') id: string) {
    return this.usuarioAuthService.suspendByAdmin(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @Patch(':id/restart')
  restartByAdmin(@Param('id') id: string) {
    return this.usuarioAuthService.restartByAdmin(+id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @Delete(':id')
  deleteByAdmin(@Param('id') id: string) {
    return this.usuarioAuthService.deleteByAdmin(+id);
  } 

}



  




