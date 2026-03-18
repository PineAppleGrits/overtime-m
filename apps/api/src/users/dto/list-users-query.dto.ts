import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@overtime-mono/shared';

export class ListUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Single role or comma-separated list of roles to filter by.
   * Example: "player"  or  "referee,photographer,official"
   */
  @IsOptional()
  @IsString()
  role?: string;
}
