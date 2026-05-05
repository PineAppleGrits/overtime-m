import {
  defaultValidUntilForYear,
  isMedicalCertValid,
  isSwornStatementValid,
} from './medical-cert-validity.rules';

describe('medical-cert-validity.rules', () => {
  describe('isMedicalCertValid', () => {
    it('returns false when asset is null', () => {
      expect(isMedicalCertValid(null, new Date('2026-06-01'))).toBe(false);
    });

    it('returns false when asset has no validUntil metadata', () => {
      const asset = { id: 'a', metadata: {} };
      expect(isMedicalCertValid(asset, new Date('2026-06-01'))).toBe(false);
    });

    it('returns true when validUntil >= asOfDate', () => {
      const asset = {
        id: 'a',
        metadata: { validUntil: '2026-12-31' },
      };
      expect(isMedicalCertValid(asset, new Date('2026-06-01'))).toBe(true);
      expect(isMedicalCertValid(asset, new Date('2026-12-31'))).toBe(true);
    });

    it('returns false when validUntil < asOfDate', () => {
      const asset = {
        id: 'a',
        metadata: { validUntil: '2025-12-31' },
      };
      expect(isMedicalCertValid(asset, new Date('2026-01-01'))).toBe(false);
    });

    it('returns false when validUntil is malformed', () => {
      const asset = {
        id: 'a',
        metadata: { validUntil: 'not-a-date' },
      };
      expect(isMedicalCertValid(asset, new Date('2026-06-01'))).toBe(false);
    });
  });

  describe('isSwornStatementValid', () => {
    it('mismo comportamiento que isMedicalCertValid', () => {
      const asset = {
        id: 'a',
        metadata: { validUntil: '2026-12-31' },
      };
      expect(isSwornStatementValid(asset, new Date('2026-06-01'))).toBe(true);
    });
  });

  describe('defaultValidUntilForYear', () => {
    it('devuelve YYYY-12-31', () => {
      expect(defaultValidUntilForYear(2026)).toBe('2026-12-31');
      expect(defaultValidUntilForYear(2030)).toBe('2030-12-31');
    });
  });
});
