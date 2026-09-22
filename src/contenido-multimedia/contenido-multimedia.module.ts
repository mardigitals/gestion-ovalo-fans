import { Module } from '@nestjs/common';
import { ContenidoMultimediaService } from './contenido-multimedia.service';
import { ContenidoMultimediaController } from './contenido-multimedia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContenidoMultimedia } from './entities/contenido-multimedia.entity';
import { PerfilStaff } from 'src/perfil-staff/entities/perfil-staff.entity';
import { SuscripcionModule } from 'src/suscripcion/suscripcion.module';
import { CloudinaryService } from './cloudinary.service';
import { VistaContenidoLog } from './entities/vista-contenido-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ContenidoMultimedia, PerfilStaff, VistaContenidoLog]),
    SuscripcionModule
  ],
  controllers: [ContenidoMultimediaController],
  providers: [ContenidoMultimediaService, CloudinaryService],
})
export class ContenidoMultimediaModule {}
