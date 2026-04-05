import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export enum SanctionTargetTypeDto {
  PROFILE = 'PROFILE',
  TEAM = 'TEAM',
}

export enum SanctionKindDto {
  DISCIPLINARY = 'DISCIPLINARY',
  MONETARY = 'MONETARY',
}

export class CreateSanctionDto {
  @ApiProperty({ enum: SanctionTargetTypeDto })
  @IsEnum(SanctionTargetTypeDto)
  targetType: SanctionTargetTypeDto;

  @ApiPropertyOptional()
  @ValidateIf((value: CreateSanctionDto) => value.targetType === SanctionTargetTypeDto.PROFILE)
  @IsUUID()
  targetProfileId?: string;

  @ApiPropertyOptional()
  @ValidateIf((value: CreateSanctionDto) => value.targetType === SanctionTargetTypeDto.TEAM)
  @IsUUID()
  targetTeamId?: string;

  @ApiProperty({ enum: SanctionKindDto })
  @IsEnum(SanctionKindDto)
  kind: SanctionKindDto;

  @ApiProperty({ description: 'Razón principal de la sanción' })
  @IsString()
  reason: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachmentUrls?: string[];

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @ValidateIf((value: CreateSanctionDto) => value.kind === SanctionKindDto.MONETARY)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ default: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;
}
