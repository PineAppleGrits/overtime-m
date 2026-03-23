import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProfileRole } from '@prisma/client';
import { PaginationDto } from '@overtime-mono/shared';

export class ListUsersQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;

    const source = Array.isArray(value) ? value : [value];
    const roles = source
      .flatMap((entry) => String(entry).split(','))
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    return roles.length > 0 ? roles : undefined;
  })
  @IsArray()
  @IsEnum(ProfileRole, { each: true })
  role?: ProfileRole[];
}
