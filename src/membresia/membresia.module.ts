import { Module } from '@nestjs/common';
import { MembresiaService } from './membresia.service';
import { MembresiaController } from './membresia.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membresia } from './entities/membresia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membresia])],
  controllers: [MembresiaController],
  providers: [MembresiaService],
})
export class MembresiaModule {}
