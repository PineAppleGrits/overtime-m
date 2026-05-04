import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class GenerateBracketDto {
  @IsDateString()
  @IsOptional()
  baseDate?: string;
}

export class OverrideSeriesDto {
  @IsUUID()
  @IsOptional()
  homeTeamId?: string | null;

  @IsUUID()
  @IsOptional()
  awayTeamId?: string | null;
}

export class ResolveTiebreakerDto {
  @IsUUID()
  winnerTeamId!: string;
}

export class GeneratePromotionDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
