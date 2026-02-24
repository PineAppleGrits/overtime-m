import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { CategoryStatus, CategorySubstatus } from '@prisma/client';

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
}
