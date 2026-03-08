import { Test, TestingModule } from '@nestjs/testing';
import { SuscripcionController } from './suscripcion.controller';
import { SuscripcionService } from './suscripcion.service';

describe('SuscripcionController', () => {
  let controller: SuscripcionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuscripcionController],
      providers: [SuscripcionService],
    }).compile();

    controller = module.get<SuscripcionController>(SuscripcionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
