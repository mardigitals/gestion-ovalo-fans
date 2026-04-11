import { Controller, Get } from '@nestjs/common';
import { ClimaService } from './clima.service';

@Controller('clima') 
export class ClimaController {
  constructor(private readonly climaService: ClimaService) {}

  @Get('rafaela') 
  async obtenerClima() {
    // Llamamos al servicio que usa RxJS por detrás
    return await this.climaService.obtenerClimaRafaela();
  }
}