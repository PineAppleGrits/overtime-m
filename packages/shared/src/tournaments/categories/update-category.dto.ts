import { IsString, IsOptional, IsInt, Min, IsEnum } from "class-validator";
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
}
