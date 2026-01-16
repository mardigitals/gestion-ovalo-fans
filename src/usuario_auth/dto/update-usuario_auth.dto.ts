import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioAuthDto } from './create-usuario_auth.dto';

export class UpdateUsuarioAuthDto extends PartialType(CreateUsuarioAuthDto) {}

