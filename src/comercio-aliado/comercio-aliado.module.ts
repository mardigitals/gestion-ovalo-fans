import { Module } from '@nestjs/common';
import { ComercioAliadoService } from './comercio-aliado.service';
import { ComercioAliadoController } from './comercio-aliado.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComercioAliado } from './entities/comercio-aliado.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComercioAliado, Suscripcion])],
  controllers: [ComercioAliadoController],
  providers: [ComercioAliadoService],
})
export class ComercioAliadoModule {}
