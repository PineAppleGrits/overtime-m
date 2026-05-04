import { SportRulesRegistry } from '../../../common/sport-rules/sport-rules.registry';
import { BusinessError, ErrorCode } from '../../../common/errors';
import { ValidateModalityUseCase } from './validate-modality.use-case';

describe('ValidateModalityUseCase', () => {
  let registry: SportRulesRegistry;
  let useCase: ValidateModalityUseCase;

  beforeEach(() => {
    registry = new SportRulesRegistry();
    useCase = new ValidateModalityUseCase(registry);
  });

  it('no falla si no se pasa modality (legacy/optional)', () => {
    expect(() =>
      useCase.execute({ sportCode: 'BASKETBALL', modality: null }),
    ).not.toThrow();
    expect(() =>
      useCase.execute({ sportCode: 'BASKETBALL' }),
    ).not.toThrow();
  });

  it('acepta combinación válida BASKETBALL + 5v5', () => {
    expect(() =>
      useCase.execute({ sportCode: 'BASKETBALL', modality: '5v5' }),
    ).not.toThrow();
  });

  it('acepta combinación válida BASKETBALL + 3v3', () => {
    expect(() =>
      useCase.execute({ sportCode: 'BASKETBALL', modality: '3v3' }),
    ).not.toThrow();
  });

  it('lanza BusinessError(TOURNAMENT_INVALID_MODALITY) ante combinación inexistente', () => {
    try {
      useCase.execute({ sportCode: 'BASKETBALL', modality: '7v7' });
      fail('expected BusinessError');
    } catch (err) {
      expect(err).toBeInstanceOf(BusinessError);
      expect((err as BusinessError).code).toBe(
        ErrorCode.TOURNAMENT_INVALID_MODALITY,
      );
      expect((err as BusinessError).details).toMatchObject({
        sportCode: 'BASKETBALL',
        modality: '7v7',
      });
    }
  });
});
