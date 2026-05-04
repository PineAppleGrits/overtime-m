import {
  isValidPaymentMethod,
  normalizeMethod,
  requiresAdminApproval,
  requiresProof,
  shouldAutoDeleteProof,
} from './method-validation.rules';

describe('Payment method-validation rules', () => {
  it('valida métodos conocidos', () => {
    expect(isValidPaymentMethod('mercadopago')).toBe(true);
    expect(isValidPaymentMethod('cash')).toBe(true);
    expect(isValidPaymentMethod('transferencia')).toBe(true);
    expect(isValidPaymentMethod('transfer')).toBe(true);
    expect(isValidPaymentMethod('other')).toBe(true);
  });

  it('rechaza métodos desconocidos', () => {
    expect(isValidPaymentMethod('crypto')).toBe(false);
    expect(isValidPaymentMethod('')).toBe(false);
  });

  it('requiresProof solo en transferencia/transfer', () => {
    expect(requiresProof('transferencia')).toBe(true);
    expect(requiresProof('transfer')).toBe(true);
    expect(requiresProof('cash')).toBe(false);
    expect(requiresProof('mercadopago')).toBe(false);
    expect(requiresProof('other')).toBe(false);
  });

  it('requiresAdminApproval excluye mercadopago', () => {
    expect(requiresAdminApproval('mercadopago')).toBe(false);
    expect(requiresAdminApproval('cash')).toBe(true);
    expect(requiresAdminApproval('transferencia')).toBe(true);
    expect(requiresAdminApproval('other')).toBe(true);
  });

  it('shouldAutoDeleteProof solo transferencia/transfer (RN-060)', () => {
    expect(shouldAutoDeleteProof('transferencia')).toBe(true);
    expect(shouldAutoDeleteProof('transfer')).toBe(true);
    expect(shouldAutoDeleteProof('cash')).toBe(false);
    expect(shouldAutoDeleteProof('mercadopago')).toBe(false);
  });

  it('normalizeMethod traduce transfer → transferencia', () => {
    expect(normalizeMethod('transfer')).toBe('transferencia');
    expect(normalizeMethod('transferencia')).toBe('transferencia');
    expect(normalizeMethod('cash')).toBe('cash');
    expect(normalizeMethod('mercadopago')).toBe('mercadopago');
  });
});
