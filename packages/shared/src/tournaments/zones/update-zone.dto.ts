import { IsString, IsOptional, IsEnum } from "class-validator";
import { FixtureAlgorithm } from "./create-zone.dto";

export class UpdateZoneDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(FixtureAlgorithm)
  @IsOptional()
  fixtureAlgorithm?: FixtureAlgorithm;
}
