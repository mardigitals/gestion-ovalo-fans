import { Module } from '@nestjs/common';
import { ComercioAliadoService } from './comercio-aliado.service';
import { ComercioAliadoController } from './comercio-aliado.controller';

@Module({
  controllers: [ComercioAliadoController],
  providers: [ComercioAliadoService],
})
export class ComercioAliadoModule {}
