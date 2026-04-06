import { ApiProperty } from '@nestjs/swagger';

export class EligibilityBlockerDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  sourceId: string;
}

export class EligibilityResponseDto {
  @ApiProperty()
  eligible: boolean;

  @ApiProperty({ type: [EligibilityBlockerDto] })
  blockers: EligibilityBlockerDto[];
}
