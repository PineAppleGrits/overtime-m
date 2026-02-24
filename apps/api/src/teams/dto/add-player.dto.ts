import { IsUUID } from 'class-validator';

export class AddPlayerDto {
  @IsUUID()
  profileId: string;
}
