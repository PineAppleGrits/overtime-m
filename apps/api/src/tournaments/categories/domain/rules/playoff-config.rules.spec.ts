import { CategorySubstatus, PlayoffFormat } from '@prisma/client';
import {
  isPlayoffConfigEditable,
  MAX_ZONES_PER_CATEGORY,
  mergePlayoffFormatWithDefaults,
  validatePlayoffFormatJson,
  validateZonesCount,
} from './playoff-config.rules';

describe('validateZonesCount (DP-003)', () => {
  it('acepta 1 y 2 zonas', () => {
    expect(validateZonesCount(1)).toBeNull();
    expect(validateZonesCount(2)).toBeNull();
  });

  it('rechaza más de 2 zonas (máximo v1)', () => {
    expect(validateZonesCount(3)).toContain(`máxima`);
    expect(validateZonesCount(MAX_ZONES_PER_CATEGORY + 1)).not.toBeNull();
  });

  it('rechaza valores menores a 1', () => {
    expect(validateZonesCount(0)).not.toBeNull();
    expect(validateZonesCount(-1)).not.toBeNull();
  });

  it('rechaza no enteros', () => {
    expect(validateZonesCount(1.5)).not.toBeNull();
    expect(validateZonesCount(NaN)).not.toBeNull();
  });
});

describe('validatePlayoffFormatJson (RN-047)', () => {
  it('acepta null/undefined (usa defaults del deporte)', () => {
    expect(validatePlayoffFormatJson(null)).toBeNull();
    expect(validatePlayoffFormatJson(undefined)).toBeNull();
  });

  it('acepta objeto vacío', () => {
    expect(validatePlayoffFormatJson({})).toBeNull();
  });

  it('acepta una configuración completa válida', () => {
    expect(
      validatePlayoffFormatJson({
        playIn: 'BO1',
        quarterfinal: 'BO3',
        semifinal: 'BO3',
        final: 'BO5',
        thirdPlace: 'BO1',
      }),
    ).toBeNull();
  });

  it('acepta una configuración parcial', () => {
    expect(
      validatePlayoffFormatJson({ semifinal: 'BO3', final: 'BO5' }),
    ).toBeNull();
  });

  it('rechaza claves desconocidas', () => {
    expect(
      validatePlayoffFormatJson({ semifinal: 'BO3', octavos: 'BO1' }),
    ).toContain('octavos');
  });

  it('rechaza formatos inválidos', () => {
    expect(validatePlayoffFormatJson({ final: 'BO7' })).toContain('BO7');
    expect(validatePlayoffFormatJson({ final: 1 })).not.toBeNull();
  });

  it('rechaza arrays', () => {
    expect(validatePlayoffFormatJson(['BO1', 'BO3'])).not.toBeNull();
  });

  it('rechaza primitivos', () => {
    expect(validatePlayoffFormatJson('BO3')).not.toBeNull();
    expect(validatePlayoffFormatJson(42)).not.toBeNull();
  });
});

describe('isPlayoffConfigEditable (RN-047)', () => {
  it('editable mientras substatus es null o REGULAR_FASE', () => {
    expect(isPlayoffConfigEditable(null)).toBe(true);
    expect(isPlayoffConfigEditable(undefined)).toBe(true);
    expect(isPlayoffConfigEditable(CategorySubstatus.REGULAR_FASE)).toBe(true);
  });

  it('NO editable cuando ya empezaron los playoffs', () => {
    expect(isPlayoffConfigEditable(CategorySubstatus.PLAYOFFS_FASE)).toBe(false);
  });
});

describe('mergePlayoffFormatWithDefaults', () => {
  const defaults = {
    playIn: PlayoffFormat.BO1,
    quarterfinal: PlayoffFormat.BO1,
    semifinal: PlayoffFormat.BO3,
    final: PlayoffFormat.BO5,
    thirdPlace: PlayoffFormat.BO1,
  };

  it('usa defaults cuando no hay config persistida', () => {
    expect(mergePlayoffFormatWithDefaults(null, defaults)).toEqual(defaults);
    expect(mergePlayoffFormatWithDefaults(undefined, defaults)).toEqual(defaults);
    expect(mergePlayoffFormatWithDefaults({}, defaults)).toEqual(defaults);
  });

  it('config persistida pisa default por ronda', () => {
    const merged = mergePlayoffFormatWithDefaults(
      { final: PlayoffFormat.BO3 },
      defaults,
    );
    expect(merged.final).toBe(PlayoffFormat.BO3);
    expect(merged.semifinal).toBe(defaults.semifinal);
  });

  it('no muta los argumentos', () => {
    const persisted = { final: PlayoffFormat.BO3 } as const;
    mergePlayoffFormatWithDefaults(persisted, defaults);
    expect(persisted).toEqual({ final: PlayoffFormat.BO3 });
  });
});
