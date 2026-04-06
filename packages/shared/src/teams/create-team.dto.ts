import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

/**
 * @deprecated Use `createTeamSchema` from `packages/shared` instead.
 */
export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsUUID()
  sportId: string;

  @IsUUID()
  @IsOptional()
  captainId?: string;

  @IsUUID()
  @IsOptional()
  franchiseId?: string;
}
