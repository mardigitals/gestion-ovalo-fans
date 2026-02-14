import { Module } from '@nestjs/common';
import { ContenidoMultimediaService } from './contenido-multimedia.service';
import { ContenidoMultimediaController } from './contenido-multimedia.controller';

@Module({
  controllers: [ContenidoMultimediaController],
  providers: [ContenidoMultimediaService],
})
export class ContenidoMultimediaModule {}
