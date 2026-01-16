import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioAuthService } from './usuario_auth.service';

describe('UsuarioAuthService', () => {
  let service: UsuarioAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuarioAuthService],
    }).compile();

    service = module.get<UsuarioAuthService>(UsuarioAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
