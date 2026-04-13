import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateMatchDto } from './create-match.dto';

export class BatchCreateMatchesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateMatchDto)
  matches: CreateMatchDto[];
}
