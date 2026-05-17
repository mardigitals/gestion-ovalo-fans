import { Module } from '@nestjs/common';
import { UsoBeneficioService } from './uso-beneficio.service';
import { UsoBeneficioController } from './uso-beneficio.controller';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';  
import { UsoBeneficio } from './entities/uso-beneficio.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from 'src/evento/entities/evento.entity';
import { MailModule } from 'src/mail/mail.module';
import { SuscripcionModule } from 'src/suscripcion/suscripcion.module';

@Module({
  imports: [TypeOrmModule.forFeature([UsoBeneficio, Suscripcion, Evento]),
    SuscripcionModule, MailModule],
  controllers: [UsoBeneficioController],
  providers: [UsoBeneficioService],
})
export class UsoBeneficioModule {}
