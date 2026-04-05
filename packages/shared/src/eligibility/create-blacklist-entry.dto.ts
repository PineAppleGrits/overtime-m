import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBlacklistEntryDto {
  @ApiPropertyOptional({ description: 'Perfil asociado a la blacklist' })
  @IsOptional()
  @IsUUID()
  profileId?: string;

  @ApiPropertyOptional({
    description: 'DNI bloqueado. Obligatorio cuando no se provee profileId',
  })
  @ValidateIf((value: CreateBlacklistEntryDto) => !value.profileId)
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    description: 'Nombre de referencia. Obligatorio cuando no se provee profileId',
  })
  @ValidateIf((value: CreateBlacklistEntryDto) => !value.profileId)
  @IsString()
  profileNameSnapshot?: string;

  @ApiProperty({ description: 'Razón del bloqueo' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Archivos o evidencias asociadas',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachmentUrls?: string[];
}
