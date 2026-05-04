# Reglas de Negocio — Pagos

## RN-060 — Auto-borrado de comprobante de transferencia tras aprobación

- **Contexto**: Pagos por transferencia que requieren que el equipo/usuario suba un **comprobante** (ver RN-014 para el caso específico de inscripción).
- **Regla**: Cuando un admin **aprueba** manualmente un pago realizado por transferencia, el comprobante se **marca para borrado automático** y se elimina del storage **3 días después** de la aprobación.
- **Alcance**:
  - Aplica únicamente a `Payment.method = transferencia` (o equivalente) que requiere comprobante.
  - **No aplica** a pagos por MercadoPago u otros métodos automáticos donde no hay comprobante adjunto.
  - **No aplica** a pagos rechazados — esos mantienen el comprobante para trazabilidad y disputa.
- **Motivo**: Reducir costo de storage y minimizar exposición de datos del comprobante una vez validado. La aprobación del admin es el evento que confirma que ya no se necesita el archivo.
- **Implementación**: cron interno (`@nestjs/schedule`) que corre diariamente y borra los `MediaAsset` con `category=PAYMENT_PROOF` cuyo `Payment` asociado fue aprobado hace ≥ 3 días.
- **Notas**: Pendiente complementar con RN sobre **conservar número de comprobante** como dato estructurado antes del borrado (ver DP-016).
