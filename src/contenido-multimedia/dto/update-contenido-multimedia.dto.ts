import { PartialType } from '@nestjs/mapped-types';
import { CreateContenidoMultimediaDto } from './create-contenido-multimedia.dto';

export class UpdateContenidoMultimediaDto extends PartialType(CreateContenidoMultimediaDto) {}
