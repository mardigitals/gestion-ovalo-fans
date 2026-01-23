import { Module } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { PerfilFanController } from './perfil-fan.controller';

@Module({
  controllers: [PerfilFanController],
  providers: [PerfilFanService],
})
export class PerfilFanModule {}
