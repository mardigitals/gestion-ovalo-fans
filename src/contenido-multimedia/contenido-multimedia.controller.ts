import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UploadedFile, ForbiddenException } from '@nestjs/common';
import { ContenidoMultimediaService } from './contenido-multimedia.service';
import { CreateContenidoMultimediaDto } from './dto/create-contenido-multimedia.dto';
import { UpdateContenidoMultimediaDto } from './dto/update-contenido-multimedia.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';
import { UseInterceptors } from '@nestjs/common';
import { CensuraVipInterceptor } from './contenido-multimedia-interceptor';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('contenido-multimedia')
export class ContenidoMultimediaController {
  constructor(private readonly contenidoMultimediaService: ContenidoMultimediaService) {}

  // 1. CREATE: Solo Prensa o SuperAdmin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Prensa')
  @Post()
  @UseInterceptors(FileInterceptor('archivo')) // Atrapa el archivo físico que viene con la llave 'archivo'
  create(@Body() createDto: CreateContenidoMultimediaDto, @Request() req, @UploadedFile() file?: Express.Multer.File ) {
    // El 'sub' o 'userId' viene del JWT
    
    return this.contenidoMultimediaService.create(createDto, req.user.userId, file);
  }

  // 2. GET ALL: Público (Cualquiera que ingrese)
  @UseInterceptors(CensuraVipInterceptor)
  @Get()
  findAll() {
    return this.contenidoMultimediaService.findAll();
  }

  // 3. GET ONE: Público
  @UseInterceptors(CensuraVipInterceptor)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contenidoMultimediaService.findOne(+id);
  }

  // 4. UPDATE: Solo el autor original
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Prensa') 
  @Patch(':id')
  @UseInterceptors(FileInterceptor('archivo'))
  async update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateContenidoMultimediaDto,
    @Request() req,
    @UploadedFile() file?: Express.Multer.File
    
  ) {
    return this.contenidoMultimediaService.update(+id, updateDto, req.user.userId, file);
  }

  // 5. DELETE: El autor o el SuperAdmin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin', 'Prensa') 
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    // Pasamos el ID del contenido, el ID del usuario y su rol
    return this.contenidoMultimediaService.remove(+id, req.user.userId, req.user.rol);
  }
}