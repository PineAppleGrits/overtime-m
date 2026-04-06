import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
} from "class-validator";
import { TournamentStatus } from "./enums";

export class UpdateTournamentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  sportId?: string;

  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus;

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
