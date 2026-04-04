import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolStaffService } from './rol-staff.service';
import { CreateRolStaffDto } from './dto/create-rol-staff.dto';
import { UpdateRolStaffDto } from './dto/update-rol-staff.dto';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';
import { RolesGuard } from 'src/usuario_auth/guards/roles.guards';
import { Roles } from 'src/usuario_auth/decorators/roles.decorators';

@Controller('rol-staff')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles('SuperAdmin')              
export class RolStaffController {
  constructor(private readonly rolStaffService: RolStaffService) {}

  @Post()
  create(@Body() createRolStaffDto: CreateRolStaffDto) {
    return this.rolStaffService.create(createRolStaffDto);
  }

  @Get()
  findAll() {
    return this.rolStaffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolStaffService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRolStaffDto: UpdateRolStaffDto) {
    return this.rolStaffService.update(+id, updateRolStaffDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolStaffService.remove(+id);
  }
}