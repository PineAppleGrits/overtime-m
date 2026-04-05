import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail,
  IsIn,
  MaxLength,
  IsUrl,
} from "class-validator";

export const ProfileRole = {
  master: "master",
  admin: "admin",
  player: "player",
  photographer: "photographer",
  referee: "referee",
  official: "official",
} as const;

export type ProfileRoleType = (typeof ProfileRole)[keyof typeof ProfileRole];
export const ProfileRoleEnum = Object.values(ProfileRole);

export class CreateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

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
