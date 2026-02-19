import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { PlayoffFormat, SeedingMethod } from './create-category.dto';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  sportId?: string;

  @IsEnum(PlayoffFormat)
  @IsOptional()
  playoffFormat?: PlayoffFormat;

  @IsInt()
  @Min(1)
  @IsOptional()
  teamsPerZone?: number;

  @IsInt()
  @Min(1)
  @Max(8)
  @IsOptional()
  teamsQualifyPerZone?: number;

  @IsInt()
  @Min(2)
  @Max(32)
  @IsOptional()
  playoffTeamsTotal?: number;

  @IsEnum(SeedingMethod)
  @IsOptional()
  playoffSeedingMethod?: SeedingMethod;

  @IsBoolean()
  @IsOptional()
  regularPhaseCompleted?: boolean;
}
