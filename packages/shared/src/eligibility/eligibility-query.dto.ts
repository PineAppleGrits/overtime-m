import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class EligibilityQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  matchId?: string;
}
