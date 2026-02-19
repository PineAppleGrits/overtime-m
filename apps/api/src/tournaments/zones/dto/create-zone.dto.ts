import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export enum FixtureAlgorithm {
  ROUND_ROBIN = 'round_robin',
  CUSTOM = 'custom',
}

export class CreateZoneDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(FixtureAlgorithm)
  @IsOptional()
  fixtureAlgorithm?: FixtureAlgorithm;
}
