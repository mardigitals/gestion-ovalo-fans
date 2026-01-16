import { Injectable } from '@nestjs/common';
import { CreateUsuarioAuthDto } from './dto/create-usuario_auth.dto';
import { UpdateUsuarioAuthDto } from './dto/update-usuario_auth.dto';

@Injectable()
export class UsuarioAuthService {
  create(createUsuarioAuthDto: CreateUsuarioAuthDto) {
    return 'This action adds a new usuarioAuth';
  }

  findAll() {
    return `This action returns all usuarioAuth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} usuarioAuth`;
  }

  update(id: number, updateUsuarioAuthDto: UpdateUsuarioAuthDto) {
    return `This action updates a #${id} usuarioAuth`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuarioAuth`;
  }
}
