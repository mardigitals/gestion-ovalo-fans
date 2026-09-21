import { Module } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { PerfilFanController } from './perfil-fan.controller';
import { PerfilFan } from './entities/perfil-fan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioAuth } from '../usuario_auth/entities/usuario_auth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilFan, UsuarioAuth])],
  controllers: [PerfilFanController],
  providers: [PerfilFanService],
})
export class PerfilFanModule {}
