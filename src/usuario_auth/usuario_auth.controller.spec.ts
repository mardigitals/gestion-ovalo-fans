import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioAuthController } from './usuario_auth.controller';
import { UsuarioAuthService } from './usuario_auth.service';

describe('UsuarioAuthController', () => {
  let controller: UsuarioAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuarioAuthController],
      providers: [UsuarioAuthService],
    }).compile();

    controller = module.get<UsuarioAuthController>(UsuarioAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
