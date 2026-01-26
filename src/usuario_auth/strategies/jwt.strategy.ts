import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Extraemos el token del header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 2. Usamos la MISMA clave que pusimos en el Module
      secretOrKey: 'PALABRA_SECRETA_RAFAELA_2026', 
    });
  }

  // 3. Si el token es válido, este método se ejecuta automáticamente
  async validate(payload: any) {
    // Lo que devolvemos acá se guarda en req.user
    return { userId: payload.sub, email: payload.email, rol: payload.rol };
  }
}