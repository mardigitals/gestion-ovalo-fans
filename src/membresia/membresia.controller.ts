import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MembresiaService } from './membresia.service';
import { CreateMembresiaDto } from './dto/create-membresia.dto';
import { UpdateMembresiaDto } from './dto/update-membresia.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';

@Controller('membresia')
export class MembresiaController {
  constructor(private readonly membresiaService: MembresiaService) {}
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  create(@Body() createMembresiaDto: CreateMembresiaDto) {
    return this.membresiaService.create(createMembresiaDto);
  }

  @Get()
  findAll() {
    return this.membresiaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membresiaService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  update(@Param('id') id: string, @Body() updateMembresiaDto: UpdateMembresiaDto) {
    return this.membresiaService.update(+id, updateMembresiaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin') 
  remove(@Param('id') id: string) {
    return this.membresiaService.remove(+id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SuperAdmin')
  restore(@Param('id') id: string) {
    return this.membresiaService.restore(+id);
}
}
