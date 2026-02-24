import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { TournamentStatus } from './enums';

export { TournamentStatus };

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

  @IsNumber()
  @Min(0)
  @IsOptional()
  insurancePerPlayer?: number;
}
