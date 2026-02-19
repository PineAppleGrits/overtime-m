import { IsString, IsOptional, IsInt, IsNumber } from 'class-validator';

export class CreatePlayerDto {
  @IsString()
  supabaseUserId: string; // Requerido: vincular directamente a Supabase User

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

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
