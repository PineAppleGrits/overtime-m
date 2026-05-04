import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePhotoFolderDto {
  @ApiPropertyOptional({
    description: 'Carpeta padre opcional (folderId de Drive). Si no se pasa, queda en raíz.',
  })
  @IsOptional()
  @IsString()
  parentFolderId?: string;
}
