import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LiftBlacklistEntryDto {
  @ApiPropertyOptional({ description: 'Notas de resolución' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
