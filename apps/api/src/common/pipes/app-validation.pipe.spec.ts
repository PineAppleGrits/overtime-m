import 'reflect-metadata';

import { BadRequestException } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { AppValidationPipe } from './app-validation.pipe';

class LegacyProfileDto {
  @IsUUID()
  profileId!: string;
}

class ZodProfileDto extends createZodDto(
  z.object({
    profileId: z.string().uuid(),
  }),
) {}

describe('AppValidationPipe', () => {
  const pipe = new AppValidationPipe();
  const validUuid = '5b32c0ab-1f55-4d7d-b63e-d4f0d1d6c8b9';

  it('validates Zod DTOs before falling back to legacy validation', async () => {
    const result = await pipe.transform(
      {
        profileId: validUuid,
      },
      {
        type: 'body',
        metatype: ZodProfileDto,
        data: '',
      },
    );

    expect(result).toEqual({
      profileId: validUuid,
    });
  });

  it('falls back to class-validator DTOs for legacy endpoints', async () => {
    const result = await pipe.transform(
      {
        profileId: validUuid,
      },
      {
        type: 'body',
        metatype: LegacyProfileDto,
        data: '',
      },
    );

    expect(result).toBeInstanceOf(LegacyProfileDto);
    expect((result as LegacyProfileDto).profileId).toBe(validUuid);
  });

  it('throws a bad request exception for invalid Zod payloads', async () => {
    await expect(
      pipe.transform(
        {
          profileId: 'invalid-uuid',
        },
        {
          type: 'body',
          metatype: ZodProfileDto,
          data: '',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
