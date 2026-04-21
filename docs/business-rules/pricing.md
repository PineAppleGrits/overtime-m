# Reglas de Negocio — Descuentos y Tarifas

## RN-020 — Descuentos manuales

- **Contexto**: Precios de inscripción.
- **Regla**: Los descuentos a equipos se aplican de forma manual.
- **Notas**: A futuro se evalúa un sistema de códigos de descuento.

## RN-021 — Tarifas configurables

- **Contexto**: Fees, aranceles y precios.
- **Regla**: Todos los montos (fees, aranceles, precios de inscripción, seguros, multas) deben ser fácilmente manipulables desde la plataforma.
- **Motivo**: Actualización ágil frente a inflación, sin requerir cambios de código.

## RN-048 — Precio de inscripción variable por período y tipo de pago

- **Contexto**: Precio de inscripción a un torneo.
- **Regla**: El precio de inscripción puede variar según (1) el **período** en que se paga (ej: early-bird vs. tarifa regular vs. tarifa tardía) y (2) el **tipo de pago** (ej: efectivo, transferencia, tarjeta).
- **Relación**: Extiende [RN-020](#rn-020--descuentos-manuales) y [RN-021](#rn-021--tarifas-configurables).
- **Notas**: Los períodos y los importes diferenciados por tipo de pago se definen a nivel torneo.
