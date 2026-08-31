import { Module } from '@nestjs/common';
import { PerfilStaffService } from './perfil-staff.service';
import { PerfilStaffController } from './perfil-staff.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilStaff } from './entities/perfil-staff.entity';
import { Usuario } from 'src/usuario/entities/usuario.entity';
import { RolStaff } from 'src/rol-staff/entities/rol-staff.entity';
import { MailModule } from 'src/mail/mail.module'; 
import { UsuarioAuth } from 'src/usuario_auth/entities/usuario_auth.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerfilStaff, Usuario, RolStaff, UsuarioAuth]), 
    MailModule, 
  ],
  controllers: [ PerfilStaffController],
  providers: [PerfilStaffService],
})
export class PerfilStaffModule {}
