import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends PartialType(
// Omitimos el FK para que nadie pueda cambiar a qué cuenta pertenece este perfil
  OmitType(CreateUsuarioDto, ['usuario_auth_id'] as const),) {}
