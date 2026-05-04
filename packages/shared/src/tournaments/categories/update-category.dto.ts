import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsObject,
} from "class-validator";
import { CategoryStatus, CategorySubstatus } from "./enums";

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

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

  // RN-044 — vínculo opcional al nivel global del deporte. `null` desconecta.
  @IsUUID()
  @IsOptional()
  categoryLevelId?: string | null;

  // DP-003 — máx 2.
  @IsInt()
  @Min(1)
  @Max(2)
  @IsOptional()
  zonesCount?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  qualifierCount?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  qualifiersPerZone?: number | null;

  @IsBoolean()
  @IsOptional()
  hasPlayIn?: boolean;

  @IsBoolean()
  @IsOptional()
  hasThirdPlaceMatch?: boolean;

  // RN-047 — solo editable mientras la categoría no haya entrado en playoffs.
  @IsObject()
  @IsOptional()
  playoffFormatByRound?: Record<string, string> | null;
}
