import { Module } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { PerfilStaffController } from './perfil-staff.controller';

@Module({
  controllers: [PerfilStaffController],
  providers: [PerfilStaffService],
})
export class PerfilStaffModule {}
