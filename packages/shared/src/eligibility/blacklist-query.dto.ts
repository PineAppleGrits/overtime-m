import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../common';

export enum BlacklistStatusDto {
  ACTIVE = 'ACTIVE',
  LIFTED = 'LIFTED',
}

export class BlacklistQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: BlacklistStatusDto })
  @IsOptional()
  @IsEnum(BlacklistStatusDto)
  status?: BlacklistStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => String)
  createdBy?: string;
}
