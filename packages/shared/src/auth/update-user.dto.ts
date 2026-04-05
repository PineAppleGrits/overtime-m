import {
  IsString,
  IsOptional,
  IsDateString,
  IsEmail,
  IsIn,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ProfileRoleEnum, ProfileRoleType } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  medicalCertificateUrl?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  swornStatementUrl?: string;

  @IsOptional()
  @IsIn(ProfileRoleEnum)
  role?: ProfileRoleType;
}
