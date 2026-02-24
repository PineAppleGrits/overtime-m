import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StaffType } from './create-staff.dto';

export class AssignStaffToMatchDto {
  @ApiProperty({ description: 'ID del staff a asignar' })
  @IsUUID()
  staffId: string;

  @ApiProperty({ description: 'Rol del staff en el partido', enum: StaffType })
  @IsEnum(StaffType)
  role: StaffType;
}
