import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ComercioAliadoService } from './comercio-aliado.service';
import { CreateComercioAliadoDto } from './dto/create-comercio-aliado.dto';
import { UpdateComercioAliadoDto } from './dto/update-comercio-aliado.dto';

@Controller('comercio-aliado')
export class ComercioAliadoController {
  constructor(private readonly comercioAliadoService: ComercioAliadoService) {}

  @Post()
  create(@Body() createComercioAliadoDto: CreateComercioAliadoDto) {
    return this.comercioAliadoService.create(createComercioAliadoDto);
  }

  @Get()
  findAll() {
    return this.comercioAliadoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comercioAliadoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateComercioAliadoDto: UpdateComercioAliadoDto) {
    return this.comercioAliadoService.update(+id, updateComercioAliadoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.comercioAliadoService.remove(+id);
  }
}
