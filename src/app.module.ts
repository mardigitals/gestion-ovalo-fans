import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioAuthModule } from './usuario_auth/usuario_auth.module';

@Module({
  imports: [UsuarioAuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
