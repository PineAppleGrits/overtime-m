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
  AMISTOSO = 'amistoso',
}

export class CreateMatchDto {
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
}
