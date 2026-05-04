import { SportRules } from '../../../common/sport-rules/sport-rules.types';
import {
  CANCEL_IN_TIME_HOURS,
  checkMinStaff,
  hoursUntilMatch,
  isWithinCancelWindow,
  meetsRescheduleThreshold,
} from './eligibility-checks.rules';

const fakeRules = {
  staff: {
    minReferees: 1,
    minTableOfficials: 1,
    idealReferees: 2,
    idealTableOfficials: 2,
  },
} as unknown as SportRules;

describe('eligibility-checks rules', () => {
  describe('checkMinStaff (RN-049)', () => {
    it('pasa cuando hay staff mínimo', () => {
      expect(
        checkMinStaff(fakeRules, { referees: 1, tableOfficials: 1 }),
      ).toBeNull();
    });
    it('falla si faltan árbitros', () => {
      const err = checkMinStaff(fakeRules, { referees: 0, tableOfficials: 1 });
      expect(err).toMatch(/árbitros/i);
    });
    it('falla si faltan oficiales de mesa', () => {
      const err = checkMinStaff(fakeRules, { referees: 1, tableOfficials: 0 });
      expect(err).toMatch(/oficiales/i);
    });
  });

  describe('hoursUntilMatch / isWithinCancelWindow (RN-032)', () => {
    it('72hs justas se considera dentro de ventana', () => {
      const now = new Date('2026-05-01T00:00:00Z');
      const future = new Date('2026-05-04T00:00:00Z');
      expect(hoursUntilMatch(future, now)).toBeCloseTo(CANCEL_IN_TIME_HOURS);
      expect(isWithinCancelWindow(future, now)).toBe(true);
    });
    it('71hs se considera fuera de ventana', () => {
      const now = new Date('2026-05-01T00:00:00Z');
      const future = new Date('2026-05-03T23:00:00Z'); // 71h
      expect(isWithinCancelWindow(future, now)).toBe(false);
    });
    it('partido en el pasado retorna 0hs', () => {
      const now = new Date('2026-05-10T00:00:00Z');
      const past = new Date('2026-05-01T00:00:00Z');
      expect(hoursUntilMatch(past, now)).toBe(0);
    });
  });

  describe('meetsRescheduleThreshold (RN-052 / DP-013)', () => {
    it('sin umbral configurado, default 72hs', () => {
      const now = new Date('2026-05-01T00:00:00Z');
      const future72 = new Date('2026-05-04T00:00:00Z');
      const future71 = new Date('2026-05-03T23:00:00Z');
      expect(meetsRescheduleThreshold(future72, now, null)).toBe(true);
      expect(meetsRescheduleThreshold(future71, now, null)).toBe(false);
    });
    it('umbral 168hs (7 días)', () => {
      const now = new Date('2026-05-01T00:00:00Z');
      const eightDays = new Date('2026-05-09T00:00:00Z');
      const sixDays = new Date('2026-05-07T00:00:00Z');
      expect(meetsRescheduleThreshold(eightDays, now, 168)).toBe(true);
      expect(meetsRescheduleThreshold(sixDays, now, 168)).toBe(false);
    });
  });
});
