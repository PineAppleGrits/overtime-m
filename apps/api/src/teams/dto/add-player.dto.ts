import { IsUUID } from 'class-validator';

export class AddPlayerDto {
  @IsUUID()
  playerId: string;
}
