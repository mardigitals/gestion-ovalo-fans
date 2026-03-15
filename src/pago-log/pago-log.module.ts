import { Module } from '@nestjs/common';
import { PagoLogService } from './pago-log.service';
import { PagoLogController } from './pago-log.controller';

@Module({
  controllers: [PagoLogController],
  providers: [PagoLogService],
})
export class PagoLogModule {}
