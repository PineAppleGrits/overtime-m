# Feature: notifications

> Owner original: W3.4. Modulo transversal de email basado en eventos de dominio; no expone endpoints HTTP propios.

## Casos de uso

1. Notificar inscripcion aprobada.
2. Notificar inscripcion rechazada.
3. Notificar amistoso generado o expirado.
4. Notificar reprogramacion o cancelacion de partido.
5. Notificar deuda vencida o deuda saldada.
6. Notificar pago aprobado.
7. Notificar sancion creada.
8. Notificar revision manual de DNI pendiente.
9. Notificar cambio de rol al usuario.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-013 | Inscripcion aprobada | `docs/business-rules/enrollments.md` |
| RN-022 | Senia de amistoso | `docs/business-rules/friendlies.md` |
| RN-023 | Vencimiento de senia | `docs/business-rules/friendlies.md` |
| RN-025 a RN-031 | Deudas, mora y AJC | `docs/business-rules/fines.md` |
| RN-036 | DNI pendiente de revision | `docs/business-rules/users.md` |
| RN-057 | Cambio de rol por staff | `docs/business-rules/users.md` |

## Modelo

### Arquitectura

- No tiene tablas propias por ahora.
- `NotificationsService` actua como facade.
- `SendEmailUseCase` es el caso de uso base.
- `ResendEmailAdapter` sale por `EmailService`.
- `PrismaNotificationContextRepository` resuelve perfiles, equipos, deudas y partidos.

### Eventos consumidos

- `registration.approved`
- `registration.rejected`
- `friendly.generated`
- `friendly.expired`
- `match.rescheduled`
- `match.cancelled`
- `debt.overdue.detected`
- `debt.fully.paid`
- `payment.approved`
- `sanction.created`
- `profile.dni.pendingReview`
- `profile.role.changed`

## Endpoints

No expone endpoints HTTP publicos ni administrativos. Todo el modulo se activa por eventos internos.

## Templates y listeners

Templates actuales:
- `registrationApprovedTemplate`
- `registrationRejectedTemplate`
- `friendlyGeneratedTemplate`
- `friendlyExpiredTemplate`
- `matchRescheduledTemplate`
- `matchCancelledTemplate`
- `debtOverdueTemplate`
- `debtPaidTemplate`
- `paymentApprovedTemplate`
- `sanctionCreatedTemplate`
- `dniPendingReviewTemplate`
- `profileRoleChangedTemplate`

Listeners activos:
- `RegistrationApprovedListener`
- `RegistrationRejectedListener`
- `FriendlyGeneratedListener`
- `FriendlyExpiredListener`
- `MatchRescheduledListener`
- `MatchCancelledListener`
- `DebtOverdueDetectedListener`
- `DebtFullyPaidListener`
- `PaymentApprovedNotificationListener`
- `SanctionCreatedListener`
- `ProfileDniPendingReviewListener`
- `ProfileRoleChangedListener`

## Casos especiales

- No persiste auditoria de envios.
- Si falta email, el listener hace `skip` o loguea warning.
- Los errores de notificacion no rompen el flujo principal del caso de uso emisor.

## Eventos del dominio

Eventos emitidos:
- ninguno

Eventos escuchados:
- `registration.approved`
- `registration.rejected`
- `friendly.generated`
- `friendly.expired`
- `match.rescheduled`
- `match.cancelled`
- `debt.overdue.detected`
- `debt.fully.paid`
- `payment.approved`
- `sanction.created`
- `profile.dni.pendingReview`
- `profile.role.changed`

## Errores especificos

- No define `ErrorCode` propios; encapsula fallos del adapter de email en logs.

## Pendientes

- Persistencia o auditoria de envios.
- Canales adicionales ademas de email.
- Posible consumo futuro de `profile.dni.verified` y `profile.merged`.
