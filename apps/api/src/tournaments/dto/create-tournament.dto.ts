import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';

export enum TournamentStatus {
  DRAFT = 'draft',
  VISIBLE = 'visible',
  INVISIBLE = 'invisible',
  INSCRIPCION_CERRADA = 'inscripcion_cerrada',
  FINALIZADO = 'finalizado',
  ARCHIVADO = 'archivado',
}

export class CreateTournamentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  sportId: string;

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus = TournamentStatus.DRAFT;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsDateString()
  @IsOptional()
  registrationStartDate?: string;

  @IsDateString()
  @IsOptional()
  registrationEndDate?: string;
}
