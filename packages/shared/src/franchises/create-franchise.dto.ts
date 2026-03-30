import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateFranchiseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
