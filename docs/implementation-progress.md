# Progreso de Implementacion - Cierre de Backend

Tracking persistente del avance del plan en `docs/implementation-plan.md`.

**Ultima actualizacion**: 2026-05-18

---

## Estado general

| Ola | Estado | Branch / PR |
|-----|--------|-------------|
| Ola 0 - PR0 Foundation | MERGEADA | PR #5 -> main `809e295` |
| Ola 1 - W1.1 Tournaments | MERGEADA | PR #6 -> main `fc001a9` |
| Ola 1 - W1.2/W1.3/W1.4 (batch) | MERGEADA | PR #7 -> main `8b3b50c` |
| Ola 2 - W2.3 Pricing & Discounts | MERGEADA | PR #8 -> main `f80bffb` |
| Ola 2 - W2.1 Debts + crons | MERGEADA | PR #9 -> main `a0915e0` |
| Ola 2 - W2.2 Payments completion | MERGEADA | PR #10 -> main `e698a45` |
| Ola 3 - W3.2 Staff completion | MERGEADA | PR #11 -> main `1fcfcfe` |
| Ola 3 - W3.1 Match lifecycle + Playoffs | MERGEADA | PR #12 -> main `c346f66` |
| Ola 3 - W3.3 Eligibility + Sanctions | MERGEADA | PR #13 -> main `f83f53f` |
| Ola 3 - W3.4 Notifications + Users | MERGEADA | PR #13 -> main `f83f53f` |

---

## Estado por ola

### Ola 0

- [x] Foundation completa.

### Ola 1

- [x] W1.1 Tournaments completion.
- [x] W1.2 Categories + Zones completion.
- [x] W1.3 Teams + categorizacion.
- [x] W1.4 Friendlies.

### Ola 2

- [x] W2.1 Debts module + cron.
- [x] W2.2 Payments completion.
- [x] W2.3 Pricing and Discounts.

### Ola 3

- [x] W3.1 Match lifecycle + Playoffs.
- [x] W3.2 Staff completion.
- [x] W3.3 Eligibility + Sanctions.
- [x] W3.4 Notifications + Users.

---

## Follow-ups cerrados despues del plan

Cambios aplicados sobre `main` local para cerrar huecos que habian quedado fuera del snapshot original:

- [x] `RegistrationsService.approve()` crea debts de inscripcion y seguro via `RegistrationPaymentsService`.
- [x] Blacklist soporta upload de adjuntos privados via `MediaAsset`.
- [x] Notifications escucha `profile.role.changed` y envia email al usuario afectado.
- [x] Feature docs agregados para `eligibility`, `sanctions`, `users` y `notifications`.

---

## Pendiente real fuera del plan

Lo que sigue abierto ya no pertenece al cierre de olas sino al backlog post-plan:

- Integracion real con Google Drive.
- Verificacion automatica de DNI.
- Descuento por franquicia.
- Suite E2E dedicada.
- Refactors tecnicos y limpieza de compatibilidad legacy.

Ver detalle en `docs/backend-todos.md`.
