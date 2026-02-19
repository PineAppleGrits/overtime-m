import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export enum PlayoffFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
}

export enum SeedingMethod {
  ZONE_POSITION = 'zone_position',
  OVERALL_RECORD = 'overall_record',
  POINTS = 'points',
}

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  tournamentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  @IsNotEmpty()
  sportId: string;

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
}
