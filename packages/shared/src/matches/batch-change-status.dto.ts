import { IsArray, IsUUID, IsEnum, ArrayMinSize } from 'class-validator';
import { MatchStatus } from './create-match.dto';

export class BatchChangeStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  matchIds: string[];

  @IsEnum(MatchStatus)
  status: MatchStatus;
}
