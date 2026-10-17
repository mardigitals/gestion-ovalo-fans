import { Controller, Post, Body, Get, UseGuards, Request, Req, Delete, Patch, Param, Query } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.auth.guards'; 
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Roles } from './decorators/roles.decorators';
import { RolesGuard } from './guards/roles.guards';
// 1. Importamos el Request de Express como un "tipo" y con un alias para evitar conflictos globales
import type { Request as ExpressRequest } from 'express'; 

@Controller('usuario-auth')
export class UsuarioAuthController {
  constructor(private readonly usuarioAuthService: UsuarioAuthService) {}

  @Post('register') 
  create(@Body() createUsuarioAuthDto: CreateUsuarioAuthDto) {
    return this.usuarioAuthService.create(createUsuarioAuthDto);
  }

  // 2. Usamos el ExpressRequest para tener acceso a req.ip y req.socket
  @Post('login') 
  login(@Body() loginDto: LoginDto, @Req() req: ExpressRequest) {
    // Extraemos la IP y el navegador de forma segura
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || 'Desconocida') as string;
    const navegador = req.headers['user-agent'] || 'Desconocido';
    
    return this.usuarioAuthService.login(loginDto, ip, navegador);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) { 
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
  
  // 3. Agregamos ": any" a req para que TypeScript no chille al buscar req.user
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  remove(@Request() req: any) { 
    return this.usuarioAuthService.remove(req.user.email);
  }

  // 4. Agregamos ": any" a req para que TypeScript no chille al buscar req.user
  @UseGuards(JwtAuthGuard) 
  @Get('perfil')
  async obtenerPerfil(@Request() req: any) { 
    const userId = req.user.id || req.user.userId;
    const rol = req.user.rol;

    return await this.usuarioAuthService.obtenerDatosCompletos(userId, rol);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  @Get('all')
  findAll(@Query('pagina') pagina: string, @Query('buscar') buscar: string) {
    const pageNumber = pagina ? Number(pagina) : 1; 
    return this.usuarioAuthService.findAll(pageNumber, 10, buscar || '');
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