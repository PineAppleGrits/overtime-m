import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FinishMatchDto {
  @IsInt()
  @Min(0)
  homeScore!: number;

  @IsInt()
  @Min(0)
  awayScore!: number;
}

export class CancelMatchByTeamDto {
  @IsUUID()
  cancellingTeamId!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RivalDecisionDto {
  @IsEnum(['request_points', 'reschedule'])
  decision!: 'request_points' | 'reschedule';

  @IsUUID()
  rivalTeamId!: string;

  @IsDateString()
  @IsOptional()
  newDate?: string;
}

export class RescheduleMatchDto {
  @IsDateString()
  newDate!: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsBoolean()
  @IsOptional()
  forceWithoutThreshold?: boolean;
}

class CurrentScoreDto {
  @IsInt()
  @Min(0)
  home!: number;

  @IsInt()
  @Min(0)
  away!: number;
}

export class SuspendMatchDto {
  @IsString()
  reason!: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrentScoreDto)
  currentScore?: CurrentScoreDto;

  @IsEnum(['reanudar', 'fin_sin_continuidad', 'pendiente'])
  resolution!: 'reanudar' | 'fin_sin_continuidad' | 'pendiente';

  @IsUUID()
  @IsOptional()
  winningTeamId?: string;
}

export class ResolveSuspendedDto {
  @IsEnum(['reanudar', 'fin_sin_continuidad'])
  resolution!: 'reanudar' | 'fin_sin_continuidad';

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CurrentScoreDto)
  currentScore?: CurrentScoreDto;

  @IsUUID()
  @IsOptional()
  winningTeamId?: string;
}

export class MutualCancelDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
