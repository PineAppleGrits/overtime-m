import { IsString, IsOptional, IsInt, IsEnum, Min, Max, IsDateString } from 'class-validator';

export enum PlayoffFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
}

export enum SeedingMethod {
  ZONE_POSITION = 'zone_position', // Alternate between zones (1A vs 2B, 1B vs 2A)
  OVERALL_RECORD = 'overall_record', // Best overall records
  POINTS = 'points', // Most points scored
}

export class GeneratePlayoffsDto {
  @IsString()
  categoryId: string;

  @IsOptional()
  @IsEnum(PlayoffFormat)
  format?: PlayoffFormat;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(32)
  teamsTotal?: number; // Override: exact number of teams for playoffs

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  teamsPerZone?: number; // Teams qualifying from each zone

  @IsOptional()
  @IsEnum(SeedingMethod)
  seedingMethod?: SeedingMethod;

  @IsOptional()
  @IsDateString()
  startDate?: string; // When playoffs start

  @IsOptional()
  @IsInt()
  @Min(1)
  daysBetweenRounds?: number; // Days between playoff rounds

  @IsOptional()
  @IsString()
  venueId?: string; // Default venue for playoff matches

  @IsOptional()
  includeThirdPlace?: boolean; // Generate third place match
}

export class UpdatePlayoffConfigDto {
  @IsOptional()
  @IsEnum(PlayoffFormat)
  playoffFormat?: PlayoffFormat;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8)
  teamsQualifyPerZone?: number;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(32)
  playoffTeamsTotal?: number;

  @IsOptional()
  @IsEnum(SeedingMethod)
  playoffSeedingMethod?: SeedingMethod;
}
