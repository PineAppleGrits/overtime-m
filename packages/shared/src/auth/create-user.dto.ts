import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
