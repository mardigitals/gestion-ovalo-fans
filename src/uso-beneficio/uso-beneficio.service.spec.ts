import { Test, TestingModule } from '@nestjs/testing';
import { UsoBeneficioService } from './uso-beneficio.service';

describe('UsoBeneficioService', () => {
  let service: UsoBeneficioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsoBeneficioService],
    }).compile();

    service = module.get<UsoBeneficioService>(UsoBeneficioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
