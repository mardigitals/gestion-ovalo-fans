import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClimaService } from 'src/utilidades/clima.service';
import { ClimaController } from 'src/utilidades/clima.controller';

@Module({
  imports: [HttpModule], 
  providers: [ClimaService],
  controllers: [ClimaController],
  exports: [ClimaService],
})
export class UtilidadesModule {}