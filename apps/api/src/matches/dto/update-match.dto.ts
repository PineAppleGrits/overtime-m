import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { MatchStatus, MatchType } from './create-match.dto';

export class UpdateMatchDto {
  @IsUUID()
  @IsOptional()
  homeTeamId?: string;

  @IsUUID()
  @IsOptional()
  awayTeamId?: string;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsUUID()
  @IsOptional()
  zoneId?: string;

  @IsUUID()
  @IsOptional()
  venueId?: string;

  @IsDateString()
  @IsOptional()
  matchDate?: string;

  @IsString()
  @IsOptional()
  matchTime?: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsEnum(MatchType)
  @IsOptional()
  matchType?: MatchType;

  @IsInt()
  @Min(0)
  @IsOptional()
  homeScore?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  awayScore?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerTeam?: number;
}
