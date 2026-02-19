import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum AnnouncementType {
  SUSPENSION = 'suspension',
  CANCELLATION = 'cancellation',
  RESCHEDULE = 'reschedule',
  OTHER = 'other',
}

export class CreateAnnouncementDto {
  @IsEnum(AnnouncementType)
  @IsNotEmpty()
  type: AnnouncementType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
