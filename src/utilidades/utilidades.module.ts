import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClimaService } from 'src/utilidades/clima.service';

@Module({
  imports: [HttpModule], 
  providers: [ClimaService],
  exports: [ClimaService],
})
export class UtilidadesModule {}