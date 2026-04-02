import { Test, TestingModule } from '@nestjs/testing';
import { ComercioAliadoService } from './comercio-aliado.service';

describe('ComercioAliadoService', () => {
  let service: ComercioAliadoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComercioAliadoService],
    }).compile();

    service = module.get<ComercioAliadoService>(ComercioAliadoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
