import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioAuthModule } from './usuario_auth/usuario_auth.module';
import { UsuarioModule } from './usuario/usuario.module';
import { PerfilFanModule } from './perfil-fan/perfil-fan.module';
import { PerfilStaffModule } from './perfil-staff/perfil-staff.module';
import { RolStaffModule } from './rol-staff/rol-staff.module';
import { ContenidoMultimediaModule } from './contenido-multimedia/contenido-multimedia.module';
import { MembresiaModule } from './membresia/membresia.module';
import { SuscripcionModule } from './suscripcion/suscripcion.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PagoLogModule } from './pago-log/pago-log.module';
import { UsoBeneficioModule } from './uso-beneficio/uso-beneficio.module';
import { EventoModule } from './evento/evento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    
    // Cambiamos forRoot por forRootAsync
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'), 
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    
    UsuarioAuthModule,
    
    UsuarioModule,
    
    PerfilFanModule,
    
    PerfilStaffModule,
    
    RolStaffModule,
    
    ContenidoMultimediaModule,
    
    MembresiaModule,
    
    SuscripcionModule,
    
    PagoLogModule,
    
    UsoBeneficioModule,
    
    EventoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}