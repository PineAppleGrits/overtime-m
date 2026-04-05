import { IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";

export class CreateFranchiseDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  logoUrl?: string;
}
