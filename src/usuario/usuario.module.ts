import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/usuario.entity';
import { JwtStrategy } from 'src/usuario_auth/strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/usuario_auth/guards/jwt.auth.guards';

@Module({
    imports: [
      TypeOrmModule.forFeature([Usuario]),
      PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
  controllers: [UsuarioController],
  providers: [UsuarioService, JwtStrategy, JwtAuthGuard],
})
export class UsuarioModule {}
