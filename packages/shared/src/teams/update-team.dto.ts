import { IsString, IsOptional } from 'class-validator';

/**
 * @deprecated Use `updateTeamSchema` from `packages/shared` instead.
 */
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
