import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolStaffService } from './rol-staff.service';
import { RolStaffController } from './rol-staff.controller';
import { RolStaff } from './entities/rol-staff.entity';
import { PerfilStaff } from 'src/perfil-staff/entities/perfil-staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolStaff, PerfilStaff])], 
  controllers: [RolStaffController],
  providers: [RolStaffService],
})
export class RolStaffModule {}