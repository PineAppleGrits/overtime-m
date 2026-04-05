import { IsString, IsOptional } from "class-validator";

export class ApproveRegistrationDto {
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
