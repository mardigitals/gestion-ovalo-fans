import { Module } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { PerfilStaffController } from './perfil-staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilStaff } from './entities/perfil-staff.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { RolStaff } from 'src/rol-staff/entities/rol-staff.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([PerfilStaff, Usuario, RolStaff]),
  ],
  controllers: [ PerfilStaffController],
  providers: [PerfilStaffService],
})
export class PerfilStaffModule {}
