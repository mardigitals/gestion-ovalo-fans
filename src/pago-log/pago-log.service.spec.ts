import { Test, TestingModule } from '@nestjs/testing';
import { PagoLogService } from './pago-log.service';

describe('PagoLogService', () => {
  let service: PagoLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PagoLogService],
    }).compile();

    service = module.get<PagoLogService>(PagoLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
