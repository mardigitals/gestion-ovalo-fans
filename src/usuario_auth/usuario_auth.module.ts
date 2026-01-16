import { Module } from '@nestjs/common';
import { UsuarioAuthService } from './usuario_auth.service';
import { UsuarioAuthController } from './usuario_auth.controller';

@Module({
  controllers: [UsuarioAuthController],
  providers: [UsuarioAuthService],
})
export class UsuarioAuthModule {}
