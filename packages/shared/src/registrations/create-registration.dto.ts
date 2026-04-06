import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRegistrationRosterPlayerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class CreateRegistrationDto {
  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @IsUUID()
  @IsNotEmpty()
  tournamentId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => CreateRegistrationRosterPlayerDto)
  initialRoster: CreateRegistrationRosterPlayerDto[];
}
