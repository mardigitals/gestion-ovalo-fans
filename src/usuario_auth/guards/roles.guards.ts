import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; 
    }

    const { user } = context.switchToHttp().getRequest();

    // Verificamos si el rol del usuario (que viene del JWT) está en la lista permitida
    const hasRole = requiredRoles.some((role) => user.rol === role);

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos de Staff para esta sección');
    }

    return true;
  }
}