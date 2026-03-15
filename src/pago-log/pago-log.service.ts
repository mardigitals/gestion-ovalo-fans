import { Injectable } from '@nestjs/common';
import { CreatePagoLogDto } from './dto/create-pago-log.dto';
import { UpdatePagoLogDto } from './dto/update-pago-log.dto';

@Injectable()
export class PagoLogService {
  create(createPagoLogDto: CreatePagoLogDto) {
    return 'This action adds a new pagoLog';
  }

  findAll() {
    return `This action returns all pagoLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pagoLog`;
  }

  update(id: number, updatePagoLogDto: UpdatePagoLogDto) {
    return `This action updates a #${id} pagoLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} pagoLog`;
  }
}
