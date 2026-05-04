import { HttpStatus } from '@nestjs/common';
import { BusinessError } from './business-error';
import { ErrorCode } from './error-codes';

describe('BusinessError', () => {
  it('expone code, message y details', () => {
    const err = new BusinessError(
      ErrorCode.REGISTRATION_DUPLICATE,
      'El equipo ya está inscripto',
      HttpStatus.CONFLICT,
      { teamId: 'abc', tournamentId: 'def' },
    );

    expect(err.code).toBe(ErrorCode.REGISTRATION_DUPLICATE);
    expect(err.details).toEqual({ teamId: 'abc', tournamentId: 'def' });
    expect(err.getStatus()).toBe(HttpStatus.CONFLICT);
    expect((err.getResponse() as { message: string }).message).toBe(
      'El equipo ya está inscripto',
    );
  });

  it('default a HTTP 400 si no se pasa status', () => {
    const err = new BusinessError(ErrorCode.VALIDATION_FAILED, 'X inválido');
    expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
  });

  it('details es opcional', () => {
    const err = new BusinessError(ErrorCode.NOT_FOUND, 'No existe');
    expect(err.details).toBeUndefined();
  });
});
