import { Module } from '@nestjs/common';
import { ComercioAliadoService } from './comercio-aliado.service';
import { ComercioAliadoController } from './comercio-aliado.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComercioAliado } from './entities/comercio-aliado.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComercioAliado])],
  controllers: [ComercioAliadoController],
  providers: [ComercioAliadoService],
})
export class ComercioAliadoModule {}
