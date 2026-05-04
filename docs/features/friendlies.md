# Feature: Friendlies (Amistosos)

## Casos de uso

1. **Solicitar amistoso (web)** — un delegado solicita un amistoso desde el formulario de la plataforma. Crea `Friendly` con `status=REQUESTED`.
2. **Solicitar amistoso (admin manual)** — admin carga manualmente una solicitud que llegó por canal externo (WhatsApp). Mismo flujo, `createdBy=admin`.
3. **Generar amistoso (admin)** — admin valida la solicitud y la "genera": crea 2 `Debt` (`FRIENDLY_DEPOSIT`) con vencimiento 24h, mueve a `GENERATED`, envía email a ambos delegados.
4. **Pagar seña** — cuando un equipo paga su `FRIENDLY_DEPOSIT`, el listener interno mueve el `Friendly` a `PENDING_CONFIRMATION` (primera seña) o `CONFIRMED` (segunda) y materializa un `Match` con `matchType='friendly'`.
5. **Cancelar amistoso** — admin o el creador puede cancelar antes de PLAYED. Cancela las debts asociadas.
6. **Expiración automática** — cron cada 30min mueve a `EXPIRED` los amistosos cuya `confirmationDeadline` venció sin que ambos pagaran. Las debts se cancelan.
7. **Marcar jugado** — al finalizar el match resultante, el amistoso pasa a `PLAYED`.
8. **Observar para categorización** — admin marca `observedForCategorization=true` para que el sistema cuente este amistoso hacia el umbral de categorización del equipo nuevo (RN-039 + DP-008).
9. **Listar y detalle** — listado filtrable por team/status/fecha. Auth-aware (delegados ven solo lo suyo, admin ve todo).

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-022 | Seña por equipo para confirmar amistoso | docs/business-rules/friendlies.md |
| RN-023 | Ventana de confirmación de 24hs | docs/business-rules/friendlies.md |
| RN-039 | Categorización de equipos nuevos vía amistosos | docs/business-rules/teams.md |
| RN-059 | Canales de solicitud (web + WhatsApp manual) | docs/business-rules/friendlies.md |

## Modelo

- **Tabla**: `friendlies`
- **Estados**: `REQUESTED → GENERATED → PENDING_CONFIRMATION → CONFIRMED → PLAYED` (también `EXPIRED`, `CANCELLED`).
- **Relaciones**: home/awayTeam (`Team`), venue (`Venue?`), debts (`Debt[]` con `type=FRIENDLY_DEPOSIT`), resultingMatch (`Match?` 1:1 cuando `CONFIRMED`).
- **Transiciones**:
  ```
  REQUESTED ─generate─> GENERATED ─pay1─> PENDING_CONFIRMATION ─pay2─> CONFIRMED ─played─> PLAYED
                            │                       │                      │
                            └──────── EXPIRED (cron, 24h) ────────┘        │
                            │                       │                      │
                            └──── CANCELLED (admin/creator) ───────────────┘
  ```

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/friendlies/request | delegate | Solicitar (web form) |
| POST   | /api/v1/friendlies | admin | Crear (admin manual desde WhatsApp) |
| PATCH  | /api/v1/friendlies/:id/generate | admin | Generar partido + crear señas |
| GET    | /api/v1/friendlies | auth | Listar con filtros |
| GET    | /api/v1/friendlies/:id | auth | Detalle |
| DELETE | /api/v1/friendlies/:id | admin/creator | Cancelar |
| PATCH  | /api/v1/friendlies/:id/mark-played | admin | Marcar jugado |
| PATCH  | /api/v1/friendlies/:id/observe-for-categorization | admin | Marcar para RN-039 |

## Eventos del dominio

**Emite**:
- `friendly.requested`, `friendly.generated`, `friendly.deposit.paid`, `friendly.confirmed`, `friendly.expired`, `friendly.cancelled`, `friendly.played`.

**Escucha**:
- `payment.approved` — si el debt es `FRIENDLY_DEPOSIT`, ejecuta `HandleDepositPaidUseCase`.
- `match.finished` (futuro W3.x) — para auto-marcar como `PLAYED` cuando el match resultante termina.

## Errores específicos

- `FRIENDLY_DEPOSIT_WINDOW_EXPIRED` — intento de pagar seña pasadas las 24h.
- `FRIENDLY_INVALID_TRANSITION` — operación no válida para el estado actual (ej. cancelar uno PLAYED).

## Cron jobs

- `cron.friendlies.expire-pending` — `@Cron('0,30 * * * *')` (cada 30 min). Mueve a EXPIRED los amistosos con `confirmationDeadline < now`. Idempotente con advisory lock (`AdvisoryLockService`).

## Pendientes / TODOs

- **DP-017**: si la seña se descuenta del costo total del partido al finalizar — todavía abierto. Por ahora `FRIENDLY_DEPOSIT` es un cargo independiente.
- **DP-008**: cantidad de amistosos requeridos para categorizar — hardcodeado en 3 con `// TODO: DP-008` en el use-case de listado de "equipos pendientes de categorizar" (W1.3 — `team-categorization`).
- `depositAmount` se pasa como input del admin al generar; cuando se decida DP-017 puede pasar a leerse del torneo o de un parámetro global.
- Refactor de `FriendlyDepositService` para usar `IDebtRepository` (Ola 2) en lugar de Prisma directo.

## Notas operativas

- El módulo se basó originalmente en una rama desactualizada por interrupción del agente; los archivos se rescataron al thread principal y commitearon en una rama integradora `feat/api/ola1-rest` junto con W1.2 y W1.3.
