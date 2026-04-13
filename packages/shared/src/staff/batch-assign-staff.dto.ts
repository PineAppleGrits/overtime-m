import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested, ArrayMinSize, IsEnum } from 'class-validator';
import { StaffType } from './create-staff.dto';

export class BatchAssignmentItem {
  @IsUUID()
  matchId: string;

  @IsUUID()
  staffId: string;

  @IsEnum(StaffType)
  role: StaffType;
}

export class BatchAssignStaffDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => BatchAssignmentItem)
  assignments: BatchAssignmentItem[];
}
