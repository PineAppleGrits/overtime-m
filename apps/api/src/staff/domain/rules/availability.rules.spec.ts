import {
  slotCoversTime,
  timeSlotsOverlap,
  timeStringToMinutes,
  validateNoOverlaps,
} from './availability.rules';

describe('availability.rules', () => {
  describe('timeStringToMinutes', () => {
    it('convierte HH:mm a minutos', () => {
      expect(timeStringToMinutes('00:00')).toBe(0);
      expect(timeStringToMinutes('09:30')).toBe(570);
      expect(timeStringToMinutes('23:59')).toBe(23 * 60 + 59);
    });
    it('rechaza formatos inválidos', () => {
      expect(() => timeStringToMinutes('25:00')).toThrow();
      expect(() => timeStringToMinutes('9:30')).not.toThrow();
      expect(() => timeStringToMinutes('foo')).toThrow();
    });
  });

  describe('timeSlotsOverlap', () => {
    it('detecta superposición real', () => {
      expect(
        timeSlotsOverlap(
          { startTime: '09:00', endTime: '11:00' },
          { startTime: '10:00', endTime: '12:00' },
        ),
      ).toBe(true);
    });
    it('considera contiguo como NO superpuesto', () => {
      expect(
        timeSlotsOverlap(
          { startTime: '09:00', endTime: '10:00' },
          { startTime: '10:00', endTime: '11:00' },
        ),
      ).toBe(false);
    });
  });

  describe('slotCoversTime', () => {
    it('incluye los extremos', () => {
      const slot = { startTime: '09:00', endTime: '11:00' };
      expect(slotCoversTime(slot, '09:00')).toBe(true);
      expect(slotCoversTime(slot, '11:00')).toBe(true);
      expect(slotCoversTime(slot, '10:30')).toBe(true);
    });
    it('excluye fuera del rango', () => {
      const slot = { startTime: '09:00', endTime: '11:00' };
      expect(slotCoversTime(slot, '08:59')).toBe(false);
      expect(slotCoversTime(slot, '11:01')).toBe(false);
    });
  });

  describe('validateNoOverlaps', () => {
    it('retorna null si no hay overlap', () => {
      expect(
        validateNoOverlaps([
          { dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
          { dayOfWeek: 1, startTime: '11:00', endTime: '13:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '11:00' },
        ]),
      ).toBeNull();
    });
    it('detecta overlap mismo día', () => {
      const result = validateNoOverlaps([
        { dayOfWeek: 1, startTime: '09:00', endTime: '11:00' },
        { dayOfWeek: 1, startTime: '10:30', endTime: '12:00' },
      ]);
      expect(result).toContain('día 1');
    });
  });
});
