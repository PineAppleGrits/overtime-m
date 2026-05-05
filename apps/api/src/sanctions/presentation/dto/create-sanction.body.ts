import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export enum SanctionTargetTypeBody {
  PROFILE = 'PROFILE',
  TEAM = 'TEAM',
}

export enum SanctionKindBody {
  DISCIPLINARY = 'DISCIPLINARY',
  MONETARY = 'MONETARY',
}

export class CreateSanctionBodyDto {
  @ApiProperty({ enum: SanctionTargetTypeBody })
  @IsEnum(SanctionTargetTypeBody)
  targetType!: SanctionTargetTypeBody;

  @ApiPropertyOptional()
  @ValidateIf((value: CreateSanctionBodyDto) => value.targetType === SanctionTargetTypeBody.PROFILE)
  @IsUUID()
  targetProfileId?: string;

  @ApiPropertyOptional()
  @ValidateIf((value: CreateSanctionBodyDto) => value.targetType === SanctionTargetTypeBody.TEAM)
  @IsUUID()
  targetTeamId?: string;

  @ApiProperty({ enum: SanctionKindBody })
  @IsEnum(SanctionKindBody)
  kind!: SanctionKindBody;

  @ApiProperty()
  @IsString()
  reason!: string;

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
  @ValidateIf((value: CreateSanctionBodyDto) => value.kind === SanctionKindBody.MONETARY)
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ default: 'ARS' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Total de fechas (sanción por N fechas, RN-003)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalFechas?: number;
}

export class ResolveSanctionBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class CancelSanctionBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationNotes?: string;
}
