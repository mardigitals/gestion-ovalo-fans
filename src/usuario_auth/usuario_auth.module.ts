import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { UsuarioAuthService } from './usuario_auth.service';
import { UsuarioAuthController } from './usuario_auth.controller';
import { UsuarioAuth } from './entities/usuario_auth.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioAuth])], 
  controllers: [UsuarioAuthController],
  providers: [UsuarioAuthService],
})
export class UsuarioAuthModule {}