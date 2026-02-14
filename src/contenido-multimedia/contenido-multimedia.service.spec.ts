import { Test, TestingModule } from '@nestjs/testing';
import { ContenidoMultimediaService } from './contenido-multimedia.service';

describe('ContenidoMultimediaService', () => {
  let service: ContenidoMultimediaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContenidoMultimediaService],
    }).compile();

    service = module.get<ContenidoMultimediaService>(ContenidoMultimediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
