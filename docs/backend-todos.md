# Backend TODOs — Cola post cierre de plan

Lista de trabajo pendiente tras completar el plan de cierre de backend (Olas 0-3, PRs #5-#13). Todo lo que está acá **no bloquea producción** — son items con default razonable o stub funcional, esperando decisión de producto o tiempo de implementación.

**Última actualización**: 2026-05-05.

---

## 1. Definiciones pendientes de producto (DPs)

Viven en detalle en [`pending-decisions.md`](./pending-decisions.md). Cada una tiene un default razonable en código y un `// TODO: DP-XXX` señalándolo. Cuando se cierre la decisión, reemplazar el TODO por la lógica final.

| DP | Tema | Estado en código | Acción al cerrar |
|----|------|------------------|------------------|
| DP-001 | Default playoff format por modalidad | Default BO1/BO3/BO5 con TODO en `bracket-generation.rules` | Ajustar defaults |
| DP-002 | Tope máximo roster 5v5 | Hardcoded `25` en `Basketball5v5Rules` | Ajustar valor |
| DP-005 | Detalles operativos del repechaje (formato + momento) | TODO en `generate-promotion-playoff` use-case | Definir formato y trigger |
| DP-006 | Pago parcial 50% para habilitar siguiente partido | Flag opcional, default `false` en `check-team-outstanding-debts` | Habilitar flag o config |
| DP-007 | Cantidad mínima de fechas para AJC | TODO en `apply-ajc` use-case | Validar X fechas cumplidas |
| DP-008 | Cantidad de amistosos para categorizar equipo nuevo | Hardcoded `3` con TODO | Ajustar umbral |
| DP-009 | Mecanismo técnico de validación de DNI | Stub adapter retorna `requiresManualReview: true` | Integrar OCR/IA o lector |
| DP-010 | Plazo del rival ante cancelación 72h | TODO en `cancel-match-by-team` | Definir plazo + default |
| DP-011 | Descuento por franquicia (N + X) | Endpoint devuelve `501 FRANCHISE_DISCOUNT_NOT_IMPLEMENTED` | Definir N, X, alcance |
| DP-013 | Umbral antelación reprogramación sin penalidad | Default 72hs en `eligibility-checks.rules` | Confirmar campo configurable |
| DP-014 | Detalle del play-in pre-playoffs | Placeholder en `bracket-generation.rules` | Definir mecánica |
| DP-015 | Formato del nombre de carpeta Google Drive | Default `{tournament}/{category}/{date}/{home}-vs-{away}` | Confirmar o ajustar |
| DP-016 | Número de comprobante estructurado | Solo se borra el archivo (RN-060), no se guarda número | Decidir si se persiste |
| DP-017 | Seña amistoso ¿se descuenta del costo total? | `FRIENDLY_DEPOSIT` es cargo independiente | Implementar lógica |

---

## 2. Integraciones reales (stubs en producción)

### 2.1 Google Drive API

**Estado**: `GoogleDriveAdapter` STUB — loguea y retorna `folderId='stub-${matchId}'`.

**Tarea**:
- Crear service account de Google Cloud con permisos de Drive.
- Cargar credenciales como secret en `.env` (ej. `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`).
- Implementar la integración real en `apps/api/src/staff/infrastructure/adapters/google-drive.adapter.ts`.
- Tests con mock del SDK de Google.

**Bloqueante**: necesita decisión sobre quién es dueño de la cuenta de Google y qué carpeta raíz usar (ver DP-015).

### 2.2 DNI Verification

**Estado**: `DniVerificationStubAdapter` retorna `{ verified: false, requiresManualReview: true }`. Admin valida manualmente vía endpoint.

**Tarea (depende de DP-009)**:
- Si OCR/IA: integrar con servicio (Google Vision, Mindee, etc.).
- Si lector físico: definir hardware y protocolo.
- Si manual: nada extra — ya funciona.

---

## 3. Refactors / limpieza opcional

### 3.1 Migración de URLs legacy a MediaAsset

**Estado**: compatibilidad híbrida vigente. Las entidades tienen tanto el campo legacy (`Profile.avatarUrl`, `Team.logoUrl`, `Profile.medicalCertificateUrl`, `Profile.swornStatementUrl`) como el nuevo (`*AssetId`). Los nuevos uploads usan `MediaAsset`; los URLs viejos siguen funcionando.

**Tarea**:
- Script de backfill que crea registros `MediaAsset` para cada URL legacy existente (sin `sha256`/`size` porque no se pueden recuperar — marcar `metadata.legacy=true`).
- Updatear los `*AssetId` en cada entidad apuntando al asset nuevo.
- Una vez backfilleado y verificado, deprecar los campos URL legacy (Prisma migration que los borra). Migración en una sola PR para no romper nada.

### 3.2 Cleanup de huérfanos en MediaAsset

**Estado**: explícitamente diferido a v2.

**Tarea**:
- Cron job que detecta `MediaAsset` con `deletedAt=null` no referenciados por ninguna entidad. Marca `scheduledDeletionAt` a +30 días.
- Job adicional que respeta `scheduledDeletionAt` (ya existe `DeleteScheduledPaymentProofsJob` — extender o crear uno general).

### 3.3 Wiring de RegistrationPaymentsService

**Estado**: `PaymentsModule` exporta `RegistrationPaymentsService` (W2.2). El `RegistrationsService` legacy **no lo invoca** todavía al aprobar postulaciones.

**Tarea**:
- En `RegistrationsService.approve()`, llamar a `RegistrationPaymentsService.createRegistrationDebts(registrationId)` para crear las debts (REGISTRATION_FEE + INSURANCE × jugador con reuso RN-017).
- Esto cierra el flujo end-to-end de inscripción → debts → pagos.

### 3.4 Refactor de RegistrationsService a clean architecture

**Estado**: el módulo no fue tocado en las olas (era pre-existente y funcional). Los demás módulos están en clean arch (b).

**Tarea**: refactor uniforme para no quedar como excepción.

---

## 4. Tests E2E

**Estado**: solo unit tests de dominio (559 passing). El plan los dejó explícitamente para "una ola dedicada posterior".

**Tarea**:
- Setup de DB de test (postgres test container o sqlite con compatibilidad Prisma).
- Suite E2E cubriendo flujos críticos:
  - Inscripción end-to-end (request → approve → debts creadas → pagos → estado OFFICIAL).
  - Amistoso end-to-end (request → admin generate → ambas señas pagadas → match materializado).
  - Match lifecycle (create → start → finish con score → standings actualizados).
  - Playoffs (completeRegularPhase → bracket generado → matches → advance → final).
  - Cron jobs (idempotencia + cargos diarios + auto-delete proofs).
- Integrar en CI.

---

## 5. Frontend integration

**Estado**: el FE consume el API a través de `packages/shared`. Los endpoints nuevos de las olas todavía no están consumidos.

**Tarea**:
- Correr `pnpm generate:api-types` para regenerar tipos OpenAPI en `packages/shared/src/generated/`.
- Por feature, implementar las pantallas que consumen los endpoints nuevos. Ejemplos:
  - Creación y configuración de torneo (incluyendo pricing periods + métodos de pago).
  - Asignación de niveles a equipos (categorización).
  - Bracket de playoffs (visualización + acciones admin: override, resolve tiebreaker).
  - Solicitud y confirmación de amistosos (pago de seña).
  - Listado de deudas + pago.
  - Subida de comprobante de transferencia.
  - Gestión de sanciones y blacklist.
  - Subida de apto médico / DDJJ con histórico.

Esto es scope de FE — no entra en el cierre de backend.

---

## 6. Decisiones técnicas pendientes

### 6.1 schema-v2 — paymentMethod columnar
**Estado**: codificado en `currency` con convención `"<CCY>:<method>"` o `"<CCY>"` (W2.3). Funciona pero es hack.

**Tarea**:
- Migration que agrega columna `paymentMethod` a `TournamentRegistrationPricing`.
- Refactor del repo para leer la columna en lugar del workaround.
- Backfill: las filas legacy quedan con `paymentMethod=null` (aplica a todos los métodos).

### 6.2 Integridad cross-módulo Payments↔Debts
**Estado**: best-effort. Si `DebtsService.applyPayment` falla tras `MarkAsPaid` exitoso, el Payment queda procesado pero la Debt no se decrementa.

**Tarea**:
- Estrategia 2PC o saga pattern.
- Alternativa más simple: outbox pattern — `Payment` aprobado encola un job que invoca `applyPayment` con retry.

---

## 7. Observabilidad y operación

**Estado**: logs básicos via Nest Logger. No hay métricas, traces, ni alertas estructuradas.

**Tarea (cuando aplique a producción)**:
- Métricas Prometheus o equivalente: latencia por endpoint, throughput, errors por code.
- Alertas en jobs críticos (cron de intereses no corrió hoy → alerta).
- Distributed tracing (OpenTelemetry).
- Health checks reales (DB, Supabase, MercadoPago).

---

## Cómo trabajar este backlog

- **Cerrar DPs**: el usuario confirma valores de DP-001 a DP-017. Por cada DP cerrada, una PR chica que reemplaza el TODO con la lógica final + actualiza `pending-decisions.md` (mover a la business rule correspondiente).
- **Integraciones reales**: por separado, cuando haya credenciales y decisión.
- **Tests E2E**: en una ola dedicada cuando se quiera invertir el tiempo.
- **Refactors**: oportunista — cuando se toque el código por otra razón.

Mantener este archivo actualizado a medida que se cierran items.
