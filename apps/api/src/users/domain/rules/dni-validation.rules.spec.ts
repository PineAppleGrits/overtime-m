import {
  DNI_PHOTO_MAX_SIZE_BYTES,
  isAcceptedDniPhotoContentType,
  isAcceptedDniPhotoSize,
  isValidDocumentNumber,
  normalizeDocumentNumber,
} from './dni-validation.rules';

describe('dni-validation.rules', () => {
  describe('normalizeDocumentNumber', () => {
    it('remueve puntos, espacios y guiones', () => {
      expect(normalizeDocumentNumber('30.123.456').normalized).toBe('30123456');
      expect(normalizeDocumentNumber('  3 0123 456 ').normalized).toBe(
        '30123456',
      );
      expect(normalizeDocumentNumber('30-123-456').normalized).toBe('30123456');
    });

    it('marca como válido un DNI de 8 dígitos', () => {
      expect(normalizeDocumentNumber('30123456').isValid).toBe(true);
    });

    it('rechaza menos de 7 dígitos o más de 9', () => {
      expect(normalizeDocumentNumber('123456').isValid).toBe(false);
      expect(normalizeDocumentNumber('1234567890').isValid).toBe(false);
    });

    it('rechaza letras', () => {
      expect(normalizeDocumentNumber('30A23456').isValid).toBe(false);
    });

    it('handle empty/null input', () => {
      expect(normalizeDocumentNumber('').isValid).toBe(false);
      expect(normalizeDocumentNumber(undefined as never).isValid).toBe(false);
    });
  });

  describe('isValidDocumentNumber', () => {
    it('shortcut funciona', () => {
      expect(isValidDocumentNumber('30.123.456')).toBe(true);
      expect(isValidDocumentNumber('foo')).toBe(false);
    });
  });

  describe('isAcceptedDniPhotoContentType', () => {
    it('acepta jpg/png/webp/pdf', () => {
      expect(isAcceptedDniPhotoContentType('image/jpeg')).toBe(true);
      expect(isAcceptedDniPhotoContentType('image/png')).toBe(true);
      expect(isAcceptedDniPhotoContentType('image/webp')).toBe(true);
      expect(isAcceptedDniPhotoContentType('application/pdf')).toBe(true);
    });

    it('rechaza otros tipos', () => {
      expect(isAcceptedDniPhotoContentType('text/plain')).toBe(false);
      expect(isAcceptedDniPhotoContentType('image/gif')).toBe(false);
    });
  });

  describe('isAcceptedDniPhotoSize', () => {
    it('acepta hasta 10MB', () => {
      expect(isAcceptedDniPhotoSize(1)).toBe(true);
      expect(isAcceptedDniPhotoSize(DNI_PHOTO_MAX_SIZE_BYTES)).toBe(true);
    });
    it('rechaza 0 o > 10MB', () => {
      expect(isAcceptedDniPhotoSize(0)).toBe(false);
      expect(isAcceptedDniPhotoSize(DNI_PHOTO_MAX_SIZE_BYTES + 1)).toBe(false);
    });
  });
});
