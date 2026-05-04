import {
  canCancelFromStatus,
  isDepositWindowExpired,
  isTerminalStatus,
  isValidTransition,
  listAllowedTransitions,
} from './transitions';

describe('Friendly transitions rules', () => {
  describe('isValidTransition', () => {
    it('REQUESTED → GENERATED es válido', () => {
      expect(isValidTransition('REQUESTED', 'GENERATED')).toBe(true);
    });

    it('REQUESTED → CANCELLED es válido', () => {
      expect(isValidTransition('REQUESTED', 'CANCELLED')).toBe(true);
    });

    it('REQUESTED → CONFIRMED no es válido (sin pasar por GENERATED)', () => {
      expect(isValidTransition('REQUESTED', 'CONFIRMED')).toBe(false);
    });

    it('GENERATED → PENDING_CONFIRMATION es válido', () => {
      expect(isValidTransition('GENERATED', 'PENDING_CONFIRMATION')).toBe(true);
    });

    it('GENERATED → EXPIRED es válido', () => {
      expect(isValidTransition('GENERATED', 'EXPIRED')).toBe(true);
    });

    it('PENDING_CONFIRMATION → CONFIRMED es válido', () => {
      expect(isValidTransition('PENDING_CONFIRMATION', 'CONFIRMED')).toBe(
        true,
      );
    });

    it('CONFIRMED → PLAYED es válido', () => {
      expect(isValidTransition('CONFIRMED', 'PLAYED')).toBe(true);
    });

    it('PLAYED → OBSERVED_FOR_CATEGORIZATION es válido', () => {
      expect(
        isValidTransition('PLAYED', 'OBSERVED_FOR_CATEGORIZATION'),
      ).toBe(true);
    });

    it('estados terminales no permiten más transiciones', () => {
      expect(isValidTransition('CANCELLED', 'GENERATED')).toBe(false);
      expect(isValidTransition('EXPIRED', 'GENERATED')).toBe(false);
      expect(
        isValidTransition('OBSERVED_FOR_CATEGORIZATION', 'PLAYED'),
      ).toBe(false);
    });

    it('un estado nunca transiciona a sí mismo', () => {
      expect(isValidTransition('REQUESTED', 'REQUESTED')).toBe(false);
      expect(isValidTransition('GENERATED', 'GENERATED')).toBe(false);
    });
  });

  describe('listAllowedTransitions', () => {
    it('REQUESTED tiene 2 transiciones permitidas', () => {
      const t = listAllowedTransitions('REQUESTED');
      expect(t).toEqual(expect.arrayContaining(['GENERATED', 'CANCELLED']));
      expect(t).toHaveLength(2);
    });

    it('CANCELLED no tiene transiciones (terminal)', () => {
      expect(listAllowedTransitions('CANCELLED')).toHaveLength(0);
    });
  });

  describe('isTerminalStatus', () => {
    it('CANCELLED, EXPIRED, OBSERVED_FOR_CATEGORIZATION son terminales', () => {
      expect(isTerminalStatus('CANCELLED')).toBe(true);
      expect(isTerminalStatus('EXPIRED')).toBe(true);
      expect(isTerminalStatus('OBSERVED_FOR_CATEGORIZATION')).toBe(true);
    });

    it('REQUESTED, GENERATED, PENDING_CONFIRMATION, CONFIRMED, PLAYED no son terminales', () => {
      expect(isTerminalStatus('REQUESTED')).toBe(false);
      expect(isTerminalStatus('GENERATED')).toBe(false);
      expect(isTerminalStatus('PENDING_CONFIRMATION')).toBe(false);
      expect(isTerminalStatus('CONFIRMED')).toBe(false);
      expect(isTerminalStatus('PLAYED')).toBe(false);
    });
  });

  describe('canCancelFromStatus', () => {
    it('REQUESTED, GENERATED, PENDING_CONFIRMATION son cancelables', () => {
      expect(canCancelFromStatus('REQUESTED')).toBe(true);
      expect(canCancelFromStatus('GENERATED')).toBe(true);
      expect(canCancelFromStatus('PENDING_CONFIRMATION')).toBe(true);
    });

    it('CONFIRMED es cancelable mientras no tenga match jugado', () => {
      expect(canCancelFromStatus('CONFIRMED', false)).toBe(true);
      expect(canCancelFromStatus('CONFIRMED', true)).toBe(false);
    });

    it('PLAYED, EXPIRED, CANCELLED, OBSERVED no son cancelables', () => {
      expect(canCancelFromStatus('PLAYED')).toBe(false);
      expect(canCancelFromStatus('EXPIRED')).toBe(false);
      expect(canCancelFromStatus('CANCELLED')).toBe(false);
      expect(canCancelFromStatus('OBSERVED_FOR_CATEGORIZATION')).toBe(false);
    });
  });

  describe('isDepositWindowExpired', () => {
    it('null/undefined deadline retorna false', () => {
      expect(isDepositWindowExpired(null)).toBe(false);
      expect(isDepositWindowExpired(undefined)).toBe(false);
    });

    it('deadline en el futuro retorna false', () => {
      const now = new Date('2026-01-01T12:00:00Z');
      const deadline = new Date('2026-01-01T13:00:00Z');
      expect(isDepositWindowExpired(deadline, now)).toBe(false);
    });

    it('deadline en el pasado retorna true', () => {
      const now = new Date('2026-01-01T12:00:00Z');
      const deadline = new Date('2026-01-01T11:00:00Z');
      expect(isDepositWindowExpired(deadline, now)).toBe(true);
    });

    it('deadline igual a now retorna true (>=)', () => {
      const now = new Date('2026-01-01T12:00:00Z');
      const deadline = new Date('2026-01-01T12:00:00Z');
      expect(isDepositWindowExpired(deadline, now)).toBe(true);
    });
  });
});
