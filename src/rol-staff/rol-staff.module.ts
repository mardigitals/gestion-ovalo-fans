import { Module } from '@nestjs/common';
import { RolStaffService } from './rol-staff.service';
import { RolStaffController } from './rol-staff.controller';

@Module({
  controllers: [RolStaffController],
  providers: [RolStaffService],
})
export class RolStaffModule {}
