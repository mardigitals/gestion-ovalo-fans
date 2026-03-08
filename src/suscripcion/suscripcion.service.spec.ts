import { Test, TestingModule } from '@nestjs/testing';
import { SuscripcionService } from './suscripcion.service';

describe('SuscripcionService', () => {
  let service: SuscripcionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuscripcionService],
    }).compile();

    service = module.get<SuscripcionService>(SuscripcionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
