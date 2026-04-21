import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
} from "class-validator";
import { TournamentStatus, FixtureFormat } from "./enums";

export { TournamentStatus, FixtureFormat };

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

  @IsEnum(FixtureFormat)
  @IsOptional()
  fixtureFormat?: FixtureFormat = FixtureFormat.SINGLE_ROUND;

  @IsString()
  @IsOptional()
  modality?: string;

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

  @IsDateString()
  @IsOptional()
  teamOperationsOpenAt?: string;

  @IsDateString()
  @IsOptional()
  teamOperationsCloseAt?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  insurancePerPlayer?: number;
}
