import { PartialType } from '@nestjs/mapped-types';
import { CreatePagoLogDto } from './create-pago-log.dto';

export class UpdatePagoLogDto extends PartialType(CreatePagoLogDto) {}
