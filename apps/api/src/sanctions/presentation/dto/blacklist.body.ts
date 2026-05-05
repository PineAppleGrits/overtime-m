import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateBlacklistEntryBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional()
  @ValidateIf((v: CreateBlacklistEntryBodyDto) => !v.profileId)
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional()
  @ValidateIf((v: CreateBlacklistEntryBodyDto) => !v.profileId)
  @IsString()
  profileNameSnapshot?: string;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachmentUrls?: string[];
}

export class LiftBlacklistEntryBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}
