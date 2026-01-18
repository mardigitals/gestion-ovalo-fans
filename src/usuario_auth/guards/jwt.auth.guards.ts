import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // Si hay un error o el usuario no existe (token inválido o no provisto)
    if (err || !user) {
      throw err || new UnauthorizedException('¡STOP THE CAR! No estás AUTORIZADO para entrar al parque cerrado de Óvalo Fans');
    }
    return user;
  }
}