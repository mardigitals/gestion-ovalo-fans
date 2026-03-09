import { Module } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suscripcion } from './entities/suscripcion.entity';
import { Membresia } from 'src/membresia/entities/membresia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suscripcion, Membresia])],
  controllers: [SuscripcionController],
  providers: [SuscripcionService],
})
export class SuscripcionModule {}
