import {
  isApprovableStatus,
  isTerminalPaymentStatus,
  isValidPaymentTransition,
  listAllowedTransitions,
} from './transitions.rules';

describe('Payment transitions rules', () => {
  it('pendiente → procesando, procesado, fallido permitido', () => {
    expect(isValidPaymentTransition('pendiente', 'procesando')).toBe(true);
    expect(isValidPaymentTransition('pendiente', 'procesado')).toBe(true);
    expect(isValidPaymentTransition('pendiente', 'fallido')).toBe(true);
  });

  it('procesando → procesado/fallido permitido', () => {
    expect(isValidPaymentTransition('procesando', 'procesado')).toBe(true);
    expect(isValidPaymentTransition('procesando', 'fallido')).toBe(true);
  });

  it('procesado → reembolsado permitido', () => {
    expect(isValidPaymentTransition('procesado', 'reembolsado')).toBe(true);
  });

  it('procesado → fallido NO permitido', () => {
    expect(isValidPaymentTransition('procesado', 'fallido')).toBe(false);
  });

  it('fallido es terminal', () => {
    expect(isTerminalPaymentStatus('fallido')).toBe(true);
    expect(listAllowedTransitions('fallido')).toEqual([]);
  });

  it('reembolsado es terminal', () => {
    expect(isTerminalPaymentStatus('reembolsado')).toBe(true);
  });

  it('procesado es terminal pero refundeable', () => {
    expect(isTerminalPaymentStatus('procesado')).toBe(true);
    expect(listAllowedTransitions('procesado')).toEqual(['reembolsado']);
  });

  it('mismo estado no es transición válida', () => {
    expect(isValidPaymentTransition('pendiente', 'pendiente')).toBe(false);
    expect(isValidPaymentTransition('procesado', 'procesado')).toBe(false);
  });

  it('isApprovableStatus refleja pendiente|procesando', () => {
    expect(isApprovableStatus('pendiente')).toBe(true);
    expect(isApprovableStatus('procesando')).toBe(true);
    expect(isApprovableStatus('procesado')).toBe(false);
    expect(isApprovableStatus('fallido')).toBe(false);
    expect(isApprovableStatus('reembolsado')).toBe(false);
  });
});
