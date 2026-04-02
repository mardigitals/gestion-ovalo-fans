import { Test, TestingModule } from '@nestjs/testing';
import { ComercioAliadoController } from './comercio-aliado.controller';
import { ComercioAliadoService } from './comercio-aliado.service';

describe('ComercioAliadoController', () => {
  let controller: ComercioAliadoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComercioAliadoController],
      providers: [ComercioAliadoService],
    }).compile();

    controller = module.get<ComercioAliadoController>(ComercioAliadoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
