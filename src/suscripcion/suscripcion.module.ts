import { Module } from '@nestjs/common';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Suscripcion } from './entities/suscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Suscripcion])],
  controllers: [SuscripcionController],
  providers: [SuscripcionService],
})
export class SuscripcionModule {}
