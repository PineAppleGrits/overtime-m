import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateVenueDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  googleMapsUrl?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
