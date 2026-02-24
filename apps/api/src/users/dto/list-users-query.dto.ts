import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@overtime-mono/shared';

export class ListUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
