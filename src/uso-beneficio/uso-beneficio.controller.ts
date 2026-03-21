import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { CreateUsoBeneficioDto } from './dto/create-uso-beneficio.dto';
import { UpdateUsoBeneficioDto } from './dto/update-uso-beneficio.dto';

@Controller('uso-beneficio')
export class UsoBeneficioController {
  constructor(private readonly usoBeneficioService: UsoBeneficioService) {}

  @Post()
  create(@Body() createUsoBeneficioDto: CreateUsoBeneficioDto) {
    return this.usoBeneficioService.create(createUsoBeneficioDto);
  }

  @Get()
  findAll() {
    return this.usoBeneficioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usoBeneficioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsoBeneficioDto: UpdateUsoBeneficioDto) {
    return this.usoBeneficioService.update(+id, updateUsoBeneficioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usoBeneficioService.remove(+id);
  }
}
