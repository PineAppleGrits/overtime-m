import { IsEnum, IsNotEmpty } from 'class-validator';
import { TournamentStatus } from './create-tournament.dto';

export class ChangeStatusDto {
  @IsEnum(TournamentStatus)
  @IsNotEmpty()
  status: TournamentStatus;
}
