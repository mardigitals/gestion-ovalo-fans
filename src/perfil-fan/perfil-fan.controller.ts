import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { CreatePerfilFanDto } from './dto/create-perfil-fan.dto';
import { UpdatePerfilFanDto } from './dto/update-perfil-fan.dto';

@Controller('perfil-fan')
export class PerfilFanController {
  constructor(private readonly perfilFanService: PerfilFanService) {}

  @Post()
  create(@Body() createPerfilFanDto: CreatePerfilFanDto) {
    return this.perfilFanService.create(createPerfilFanDto);
  }

  @Get()
  findAll() {
    return this.perfilFanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilFanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePerfilFanDto: UpdatePerfilFanDto) {
    return this.perfilFanService.update(+id, updatePerfilFanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.perfilFanService.remove(+id);
  }
}
