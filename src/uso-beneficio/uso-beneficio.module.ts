import { Module } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { UsoBeneficioController } from './uso-beneficio.controller';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';  
import { UsoBeneficio } from './entities/uso-beneficio.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([UsoBeneficio, Suscripcion])],
  controllers: [UsoBeneficioController],
  providers: [UsoBeneficioService],
})
export class UsoBeneficioModule {}
