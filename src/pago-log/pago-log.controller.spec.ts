import { Test, TestingModule } from '@nestjs/testing';
import { PagoLogController } from './pago-log.controller';
import { PagoLogService } from './pago-log.service';

describe('PagoLogController', () => {
  let controller: PagoLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagoLogController],
      providers: [PagoLogService],
    }).compile();

    controller = module.get<PagoLogController>(PagoLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
