import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagoLogService } from './pago-log.service';
import { PagoLogController } from './pago-log.controller';
import { PagoLog } from './entities/pago-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PagoLog])],
  controllers: [PagoLogController],
  providers: [PagoLogService],
  exports: [PagoLogService] 
})
export class PagoLogModule {}