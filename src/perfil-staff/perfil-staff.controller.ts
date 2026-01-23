import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';

@Controller('perfil-staff')
export class PerfilStaffController {
  constructor(private readonly perfilStaffService: PerfilStaffService) {}

  @Post()
  create(@Body() createPerfilStaffDto: CreatePerfilStaffDto) {
    return this.perfilStaffService.create(createPerfilStaffDto);
  }

  @Get()
  findAll() {
    return this.perfilStaffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilStaffService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePerfilStaffDto: UpdatePerfilStaffDto) {
    return this.perfilStaffService.update(+id, updatePerfilStaffDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.perfilStaffService.remove(+id);
  }
}
