import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';

export enum MatchStatus {
  PROGRAMADO = 'programado',
  EN_CURSO = 'en_curso',
  SUSPENDIDO = 'suspendido',
  CANCELADO = 'cancelado',
  REPROGRAMADO = 'reprogramado',
  FINALIZADO = 'finalizado',
}

export enum MatchType {
  REGULAR = 'regular',
  PLAYOFF = 'playoff',
  SEMIFINAL = 'semifinal',
  FINAL = 'final',
  THIRD_PLACE = 'third_place',
  AMISTOSO = 'amistoso',
}

export class CreateMatchDto {
  @IsUUID()
  @IsOptional() // Optional for playoff matches where team is TBD
  homeTeamId?: string;

  @IsUUID()
  @IsOptional() // Optional for playoff matches where team is TBD
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
  @IsNotEmpty()
  matchDate: string;

  @IsString()
  @IsOptional()
  matchTime?: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus = MatchStatus.PROGRAMADO;

  @IsEnum(MatchType)
  @IsOptional()
  matchType?: MatchType = MatchType.REGULAR;

  @IsInt()
  @Min(0)
  @IsOptional()
  homeScore?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  awayScore?: number = 0;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPerTeam?: number;

  // Playoff bracket fields
  @IsInt()
  @Min(1)
  @IsOptional()
  playoffRound?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  playoffPosition?: number;

  @IsString()
  @IsOptional()
  bracketPosition?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  homeSeed?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  awaySeed?: number;
}
