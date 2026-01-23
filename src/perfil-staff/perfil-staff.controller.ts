import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { CreatePerfilStaffDto } from './dto/create-perfil-staff.dto';
import { UpdatePerfilStaffDto } from './dto/update-perfil-staff.dto';

@Controller('perfil-staff')
export class PerfilStaffController {
  constructor(private readonly perfilStaffService: PerfilStaffService) {}
  //solo permitido a rol staff= admin o 1 (el usuario ya debe estar creado por el user, y el admin despues lo habilita como rol 2 o 3 de staff)
  @Post()
  create(@Body() createPerfilStaffDto: CreatePerfilStaffDto) {
    return this.perfilStaffService.create(createPerfilStaffDto);
  }
//solo permitido a rol staff= admin o 1
  @Get()
  findAll() {
    return this.perfilStaffService.findAll();
  }

  //solo permitido a rol staff= admin o 1 
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilStaffService.findOne(+id);
  }

  //solo permitido a rol staff= admin o 1
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePerfilStaffDto: UpdatePerfilStaffDto) {
    return this.perfilStaffService.update(+id, updatePerfilStaffDto);
  }

  //solo permitido a rol staff= admin o 1
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.perfilStaffService.remove(+id);
  }
}
