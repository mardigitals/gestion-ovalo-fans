import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolStaffService } from './rol-staff.service';
import { RolStaffController } from './rol-staff.controller';
import { RolStaff } from './entities/rol-staff.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RolStaff])], 
  controllers: [RolStaffController],
  providers: [RolStaffService],
})
export class RolStaffModule {}