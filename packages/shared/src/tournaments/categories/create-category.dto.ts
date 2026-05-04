import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsObject,
} from "class-validator";
import { CategoryStatus, CategorySubstatus } from "./enums";

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  tournamentId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxTeams?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  teamsPerZone?: number;

  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @IsEnum(CategorySubstatus)
  @IsOptional()
  substatus?: CategorySubstatus;

  // RN-044 — vínculo opcional al nivel global del deporte.
  @IsUUID()
  @IsOptional()
  categoryLevelId?: string;

  // DP-003 — máximo 2 zonas en v1 (validado a fondo en el service).
  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  zonesCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  qualifierCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  qualifiersPerZone?: number;

  @IsBoolean()
  @IsOptional()
  hasPlayIn?: boolean;

  @IsBoolean()
  @IsOptional()
  hasThirdPlaceMatch?: boolean;

  // RN-047 — JSON `{ playIn?: 'BO1'|'BO3'|'BO5', quarterfinal?, semifinal?, final?, thirdPlace? }`.
  @IsObject()
  @IsOptional()
  playoffFormatByRound?: Record<string, string>;
}
