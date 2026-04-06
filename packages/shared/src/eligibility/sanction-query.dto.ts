import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../common';
import { SanctionKindDto, SanctionTargetTypeDto } from './create-sanction.dto';

export enum SanctionStatusDto {
  ACTIVE = 'ACTIVE',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export class SanctionQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: SanctionStatusDto })
  @IsOptional()
  @IsEnum(SanctionStatusDto)
  status?: SanctionStatusDto;

  @ApiPropertyOptional({ enum: SanctionKindDto })
  @IsOptional()
  @IsEnum(SanctionKindDto)
  kind?: SanctionKindDto;

  @ApiPropertyOptional({ enum: SanctionTargetTypeDto })
  @IsOptional()
  @IsEnum(SanctionTargetTypeDto)
  targetType?: SanctionTargetTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetProfileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  targetTeamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  matchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tournamentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
