import { IsEnum, IsNotEmpty } from 'class-validator';
import { MatchStatus } from './create-match.dto';

export class ChangeMatchStatusDto {
  @IsEnum(MatchStatus)
  @IsNotEmpty()
  status: MatchStatus;
}
