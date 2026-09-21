import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('perfil-fan')
export class PerfilFanController {
  constructor(private readonly perfilFanService: PerfilFanService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPerfilFanDto: CreatePerfilFanDto, @Request() req) {
  console.log(req.user)
  const userId = req.user.userId;
  const usuarioAuthId = req.user.authId;
  return this.perfilFanService.create(createPerfilFanDto, userId, usuarioAuthId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Administrativo') // Solo el staff ve la lista completa
  findAll() {
    return this.perfilFanService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Cualquier logueado entra, pero el Service valida el ID
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.rol;

    // El Service se encargará de la lógica de "Es mi perfil O soy jefe"
    return this.perfilFanService.findOne(+id, userId, userRole);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, 
    @Body() updatePerfilFanDto: UpdatePerfilFanDto, 
    @Request() req
  ) {
    // Usamos esto por si el token guarda "id" en vez de "userId"
    const userId = req.user.id || req.user.userId; 
    return this.perfilFanService.update(+id, updatePerfilFanDto, userId);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars', // La carpeta donde se van a guardar físicamente
      filename: (req, file, cb) => {
        // Le inventamos un nombre único para que no se pisen si se llaman igual
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se envió ninguna imagen');
    }
    // Armamos la URL pública que va a usar React para mostrar la foto
    const avatarUrl = `http://localhost:3000/uploads/avatars/${file.filename}`;
    
    // Llamamos al servicio para que guarde esta URL en la tabla perfil_fan
    return this.perfilFanService.actualizarAvatar(+id, avatarUrl);
  }
}