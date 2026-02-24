import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

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
}
