import { IsString, IsOptional, IsEmail, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StaffType {
  REFEREE = 'referee',
  TABLE_OFFICIAL = 'table_official',
  PHOTOGRAPHER = 'photographer',
}

export class CreateStaffDto {
  @ApiProperty({ description: 'Tipo de personal', enum: StaffType })
  @IsEnum(StaffType)
  type: StaffType;

  @ApiProperty({ description: 'Nombre del personal' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Apellido del personal' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email de contacto' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'ID del perfil asociado (si tiene cuenta)' })
  @IsOptional()
  @IsUUID()
  profileId?: string;
}
