import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';

export class UpdatePlayerDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsInt()
  @IsOptional()
  jerseyNumber?: number;

  @IsString()
  @IsOptional()
  position?: string;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}
