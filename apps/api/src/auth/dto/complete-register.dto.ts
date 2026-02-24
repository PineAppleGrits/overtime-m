import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CompleteRegisterDto {
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
