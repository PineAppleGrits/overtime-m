import { IsString, IsOptional } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  sportId?: string;

  @IsString()
  @IsOptional()
  captainId?: string;
}
