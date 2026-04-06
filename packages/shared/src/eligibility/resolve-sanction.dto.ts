import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveSanctionDto {
  @ApiPropertyOptional({ description: 'Notas de resolución' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
