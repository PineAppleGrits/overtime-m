import {
  isActiveStatus,
  isAdminAllowedTransition,
  isTerminalStatus,
  isValidTransition,
  listAdminAllowedTransitions,
  listAllowedTransitions,
} from './transitions';

describe('Debt transitions rules (RN-031)', () => {
  describe('isValidTransition', () => {
    it('APPROVED → PARTIALLY_PAID es válido', () => {
      expect(isValidTransition('APPROVED', 'PARTIALLY_PAID')).toBe(true);
    });

    it('APPROVED → PAID es válido', () => {
      expect(isValidTransition('APPROVED', 'PAID')).toBe(true);
    });

    it('APPROVED → DELETED_BY_ERROR es válido', () => {
      expect(isValidTransition('APPROVED', 'DELETED_BY_ERROR')).toBe(true);
    });

    it('APPROVED → DELETED_WITH_RECORD es válido', () => {
      expect(isValidTransition('APPROVED', 'DELETED_WITH_RECORD')).toBe(true);
    });

    it('APPROVED → CANCELLED es válido', () => {
      expect(isValidTransition('APPROVED', 'CANCELLED')).toBe(true);
    });

    it('PARTIALLY_PAID → PAID es válido', () => {
      expect(isValidTransition('PARTIALLY_PAID', 'PAID')).toBe(true);
    });

    it('PARTIALLY_PAID → CANCELLED es válido', () => {
      expect(isValidTransition('PARTIALLY_PAID', 'CANCELLED')).toBe(true);
    });

    it('PARTIALLY_PAID → DELETED_BY_ERROR no es válido', () => {
      // Una vez con pagos parciales, sólo se puede CANCELLED o terminar PAID.
      expect(isValidTransition('PARTIALLY_PAID', 'DELETED_BY_ERROR')).toBe(
        false,
      );
    });

    it('estados terminales no permiten más transiciones', () => {
      expect(isValidTransition('PAID', 'APPROVED')).toBe(false);
      expect(isValidTransition('CANCELLED', 'APPROVED')).toBe(false);
      expect(isValidTransition('DELETED_BY_ERROR', 'APPROVED')).toBe(false);
      expect(isValidTransition('DELETED_WITH_RECORD', 'APPROVED')).toBe(false);
    });

    it('un estado nunca transiciona a sí mismo', () => {
      expect(isValidTransition('APPROVED', 'APPROVED')).toBe(false);
      expect(isValidTransition('PARTIALLY_PAID', 'PARTIALLY_PAID')).toBe(false);
      expect(isValidTransition('PAID', 'PAID')).toBe(false);
    });
  });

  describe('isAdminAllowedTransition', () => {
    it('admin puede APPROVED → DELETED_BY_ERROR', () => {
      expect(isAdminAllowedTransition('APPROVED', 'DELETED_BY_ERROR')).toBe(
        true,
      );
    });

    it('admin puede APPROVED → DELETED_WITH_RECORD', () => {
      expect(isAdminAllowedTransition('APPROVED', 'DELETED_WITH_RECORD')).toBe(
        true,
      );
    });

    it('admin puede APPROVED → CANCELLED', () => {
      expect(isAdminAllowedTransition('APPROVED', 'CANCELLED')).toBe(true);
    });

    it('admin puede PARTIALLY_PAID → CANCELLED', () => {
      expect(isAdminAllowedTransition('PARTIALLY_PAID', 'CANCELLED')).toBe(
        true,
      );
    });

    it('admin NO puede APPROVED → PAID (lo dispara applyPayment)', () => {
      expect(isAdminAllowedTransition('APPROVED', 'PAID')).toBe(false);
    });

    it('admin NO puede APPROVED → PARTIALLY_PAID (lo dispara applyPayment)', () => {
      expect(isAdminAllowedTransition('APPROVED', 'PARTIALLY_PAID')).toBe(
        false,
      );
    });

    it('admin NO puede PARTIALLY_PAID → DELETED_BY_ERROR', () => {
      expect(
        isAdminAllowedTransition('PARTIALLY_PAID', 'DELETED_BY_ERROR'),
      ).toBe(false);
    });

    it('admin NO puede transicionar desde estados terminales', () => {
      expect(isAdminAllowedTransition('PAID', 'CANCELLED')).toBe(false);
      expect(isAdminAllowedTransition('CANCELLED', 'APPROVED')).toBe(false);
      expect(isAdminAllowedTransition('DELETED_BY_ERROR', 'APPROVED')).toBe(
        false,
      );
    });
  });

  describe('listAllowedTransitions', () => {
    it('APPROVED tiene 5 transiciones', () => {
      expect(listAllowedTransitions('APPROVED')).toHaveLength(5);
    });

    it('PAID es terminal', () => {
      expect(listAllowedTransitions('PAID')).toHaveLength(0);
    });
  });

  describe('listAdminAllowedTransitions', () => {
    it('APPROVED tiene 3 transiciones admin', () => {
      const t = listAdminAllowedTransitions('APPROVED');
      expect(t).toEqual(
        expect.arrayContaining([
          'DELETED_BY_ERROR',
          'DELETED_WITH_RECORD',
          'CANCELLED',
        ]),
      );
      expect(t).toHaveLength(3);
    });

    it('PARTIALLY_PAID solo permite CANCELLED admin', () => {
      const t = listAdminAllowedTransitions('PARTIALLY_PAID');
      expect(t).toEqual(['CANCELLED']);
    });
  });

  describe('isTerminalStatus', () => {
    it('PAID, CANCELLED, DELETED_BY_ERROR, DELETED_WITH_RECORD son terminales', () => {
      expect(isTerminalStatus('PAID')).toBe(true);
      expect(isTerminalStatus('CANCELLED')).toBe(true);
      expect(isTerminalStatus('DELETED_BY_ERROR')).toBe(true);
      expect(isTerminalStatus('DELETED_WITH_RECORD')).toBe(true);
    });

    it('APPROVED y PARTIALLY_PAID no son terminales', () => {
      expect(isTerminalStatus('APPROVED')).toBe(false);
      expect(isTerminalStatus('PARTIALLY_PAID')).toBe(false);
    });
  });

  describe('isActiveStatus', () => {
    it('APPROVED y PARTIALLY_PAID son activos (exigibles)', () => {
      expect(isActiveStatus('APPROVED')).toBe(true);
      expect(isActiveStatus('PARTIALLY_PAID')).toBe(true);
    });

    it('los terminales no son activos', () => {
      expect(isActiveStatus('PAID')).toBe(false);
      expect(isActiveStatus('CANCELLED')).toBe(false);
      expect(isActiveStatus('DELETED_BY_ERROR')).toBe(false);
      expect(isActiveStatus('DELETED_WITH_RECORD')).toBe(false);
    });
  });
});
