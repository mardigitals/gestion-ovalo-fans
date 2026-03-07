import { Module } from '@nestjs/common';
import { PerfilFanService } from './perfil-fan.service';
import { PerfilFanController } from './perfil-fan.controller';
import { PerfilFan } from './entities/perfil-fan.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilFan])],
  controllers: [PerfilFanController],
  providers: [PerfilFanService],
})
export class PerfilFanModule {}
