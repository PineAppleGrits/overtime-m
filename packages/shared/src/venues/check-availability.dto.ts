import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsUUID()
  @IsOptional()
  excludeMatchId?: string;
}
