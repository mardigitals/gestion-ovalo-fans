import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { Evento } from './entities/evento.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([Evento])], 
  controllers: [EventoController],
  providers: [EventoService]
})
export class EventoModule {}