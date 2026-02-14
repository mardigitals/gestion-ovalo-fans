import { Injectable } from '@nestjs/common';
import { CreateContenidoMultimediaDto } from './dto/create-contenido-multimedia.dto';
import { UpdateContenidoMultimediaDto } from './dto/update-contenido-multimedia.dto';

@Injectable()
export class ContenidoMultimediaService {
  create(createContenidoMultimediaDto: CreateContenidoMultimediaDto) {
    return 'This action adds a new contenidoMultimedia';
  }

  findAll() {
    return `This action returns all contenidoMultimedia`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contenidoMultimedia`;
  }

  update(id: number, updateContenidoMultimediaDto: UpdateContenidoMultimediaDto) {
    return `This action updates a #${id} contenidoMultimedia`;
  }

  remove(id: number) {
    return `This action removes a #${id} contenidoMultimedia`;
  }
}
