import { Test, TestingModule } from '@nestjs/testing';
import { UsoBeneficioController } from './uso-beneficio.controller';
import { UsoBeneficioService } from './uso-beneficio.service';

describe('UsoBeneficioController', () => {
  let controller: UsoBeneficioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsoBeneficioController],
      providers: [UsoBeneficioService],
    }).compile();

    controller = module.get<UsoBeneficioController>(UsoBeneficioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
