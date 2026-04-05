import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import {
  CreateBlacklistEntryDto,
  CreateSanctionDto,
} from '@overtime-mono/shared';

describe('eligibility shared dto contracts', () => {
  it('requires documentNumber when creating a blacklist without profileId', () => {
    const dto = plainToInstance(CreateBlacklistEntryDto, {
      profileNameSnapshot: 'Jugador',
      reason: 'DNI',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('requires amount for monetary sanctions', () => {
    const dto = plainToInstance(CreateSanctionDto, {
      targetType: 'TEAM',
      targetTeamId: '00000000-0000-4000-8000-000000000001',
      kind: 'MONETARY',
      reason: 'Multa',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
