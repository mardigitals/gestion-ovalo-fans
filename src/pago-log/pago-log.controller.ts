import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PagoLogService } from './pago-log.service';
import { CreatePagoLogDto } from './dto/create-pago-log.dto';
import { UpdatePagoLogDto } from './dto/update-pago-log.dto';

@Controller('pago-log')
export class PagoLogController {
  constructor(private readonly pagoLogService: PagoLogService) {}

  @Post()
  create(@Body() createPagoLogDto: CreatePagoLogDto) {
    return this.pagoLogService.create(createPagoLogDto);
  }

  @Get()
  findAll() {
    return this.pagoLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagoLogService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePagoLogDto: UpdatePagoLogDto) {
    return this.pagoLogService.update(+id, updatePagoLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pagoLogService.remove(+id);
  }
}
