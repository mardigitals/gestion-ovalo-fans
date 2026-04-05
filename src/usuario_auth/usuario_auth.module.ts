import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { UsuarioAuthService } from './usuario_auth.service';
import { UsuarioAuthController } from './usuario_auth.controller';
import { UsuarioAuth } from './entities/usuario_auth.entity'; 
import { JwtModule } from '@nestjs/jwt'; 
import { PassportModule } from '@nestjs/passport'; 
import { JwtStrategy } from './strategies/jwt.strategy';
import { Usuario } from 'src/usuario/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsuarioAuth, Usuario]),
    PassportModule,
    // Configuramos el generador de tokens
    JwtModule.register({
      global:true,
      secret: 'PALABRA_SECRETA_RAFAELA_2026', // Después esto irá al .env por seguridad
      signOptions: { expiresIn: '1h' }, // El token dura 1 hora
    }),
  ],
  controllers: [UsuarioAuthController],
  providers: [UsuarioAuthService, JwtStrategy],
})
export class UsuarioAuthModule {}
