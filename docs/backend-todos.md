# Backend TODOs - Cola post cierre de plan

Lista de trabajo pendiente tras completar el plan de cierre de backend. Lo que queda aca no forma parte de las olas originales; es backlog post-plan, integraciones reales o deuda tecnica.

**Ultima actualizacion**: 2026-05-18.

---

## Cerrado recientemente

Items que ya no deben considerarse pendientes:

- `RegistrationsService.approve()` ya crea debts de inscripcion y seguro via `RegistrationPaymentsService`.
- Blacklist ya soporta adjuntos privados via `MediaAsset`.
- Notifications ya escucha `profile.role.changed`.
- Feature docs agregados para `eligibility`, `sanctions`, `users` y `notifications`.

---

## 1. Definiciones pendientes de producto

Viven en detalle en [`pending-decisions.md`](./pending-decisions.md). Cada una tiene un default razonable en codigo y un `TODO: DP-XXX`.

| DP | Tema | Estado en codigo | Accion al cerrar |
|----|------|------------------|------------------|
| DP-001 | Default playoff format por modalidad | Default BO1/BO3/BO5 con TODO en `bracket-generation.rules` | Ajustar defaults |
| DP-002 | Tope maximo roster 5v5 | Hardcoded `25` en `Basketball5v5Rules` | Ajustar valor |
| DP-005 | Detalles operativos del repechaje | TODO en `generate-promotion-playoff` | Definir formato y trigger |
| DP-006 | Pago parcial 50 por ciento para habilitar siguiente partido | Flag opcional, default `false` | Habilitar flag o config |
| DP-007 | Cantidad minima de fechas para AJC | TODO en `apply-ajc` | Validar X fechas cumplidas |
| DP-008 | Cantidad de amistosos para categorizar equipo nuevo | Hardcoded `3` con TODO | Ajustar umbral |
| DP-009 | Mecanismo tecnico de validacion de DNI | Stub adapter retorna `requiresManualReview: true` | Integrar OCR, IA o lector |
| DP-010 | Plazo del rival ante cancelacion 72h | TODO en `cancel-match-by-team` | Definir plazo y default |
| DP-011 | Descuento por franquicia | Endpoint devuelve `501 FRANCHISE_DISCOUNT_NOT_IMPLEMENTED` | Definir N, X y alcance |
| DP-013 | Umbral de reprogramacion sin penalidad | Default 72h en reglas de elegibilidad | Confirmar campo configurable |
| DP-014 | Detalle del play-in pre-playoffs | Placeholder en `bracket-generation.rules` | Definir mecanica |
| DP-015 | Formato del nombre de carpeta Google Drive | Default `{tournament}/{category}/{date}/{home}-vs-{away}` | Confirmar o ajustar |
| DP-016 | Numero de comprobante estructurado | No se persiste | Decidir si se guarda |
| DP-017 | La senia de amistoso se descuenta o no del costo total | `FRIENDLY_DEPOSIT` es cargo independiente | Implementar logica |

---

## 2. Integraciones reales

### 2.1 Google Drive API

Estado actual:
- `GoogleDriveAdapter` sigue stub y retorna `folderId='stub-${matchId}'`.

Tareas:
- Crear service account con permisos de Drive.
- Cargar credenciales en entorno.
- Implementar integracion real en `apps/api/src/staff/infrastructure/adapters/google-drive.adapter.ts`.
- Agregar tests con mock del SDK.

Bloqueante:
- Requiere cerrar DP-015 y definir carpeta raiz.

### 2.2 DNI verification automatica

Estado actual:
- `DniVerificationStubAdapter` devuelve `verified=false` y `requiresManualReview=true`.

Tareas:
- Integrar proveedor real si se cierra DP-009.
- O dejar manual como flujo final y documentarlo como decision explicita.

---

## 3. Refactors y limpieza

### 3.1 Migracion de URLs legacy a MediaAsset

Estado actual:
- Convive compatibilidad hibrida entre campos URL legacy y `*AssetId`.

Tareas:
- Script de backfill para crear `MediaAsset` por cada URL legacy.
- Actualizar entidades para apuntar a los assets nuevos.
- Deprecar los campos URL legacy cuando el backfill este validado.

### 3.2 Cleanup de huerfanos en MediaAsset

Estado actual:
- Diferido a v2.

Tareas:
- Detectar assets no referenciados.
- Marcar `scheduledDeletionAt`.
- Ejecutar borrado diferido con job dedicado o generalizado.

### 3.3 Refactor de RegistrationsService a clean architecture

Estado actual:
- El wiring de debts ya esta resuelto, pero el modulo sigue siendo de los pocos que conservan estructura legacy.

Tareas:
- Separar casos de uso.
- Reducir logica en service legacy.
- Alinear con el patron del resto del backend.

---

## 4. Tests E2E

Estado actual:
- Hay tests unitarios de dominio, pero no una suite E2E real del backend.

Tareas:
- Setup de DB de test.
- Cubrir flujos criticos:
  - inscripcion end to end;
  - amistoso end to end;
  - match lifecycle;
  - playoffs;
  - cron jobs.
- Integrar en CI.

---

## 5. Frontend integration

Estado actual:
- El FE no consume todo lo que exponen las olas nuevas.

Tareas:
- Regenerar tipos OpenAPI.
- Implementar pantallas para pricing, categorizacion, playoffs, amistosos, deudas, pagos, sanciones, blacklist y uploads documentales.

Esto es scope de FE y no bloquea el cierre del backend.

---

## 6. Decisiones tecnicas pendientes

### 6.1 `paymentMethod` columnar

Estado actual:
- Se codifica dentro de `currency` como workaround.

Tareas:
- Agregar columna `paymentMethod`.
- Refactor del repo.
- Backfill de filas legacy.

### 6.2 Integridad Payments <-> Debts

Estado actual:
- El flujo es best effort.

Tareas:
- Definir estrategia de consistencia, por ejemplo saga u outbox con retry.

---

## 7. Observabilidad y operacion

Estado actual:
- Solo logs basicos.

Tareas:
- Metricas.
- Alertas de jobs criticos.
- Tracing.
- Health checks reales.

---

## 8. Endpoints faltantes para retirar mocks del frontend

Detalle completo en [`frontend-mocks-debt.md`](./frontend-mocks-debt.md).

Pendientes mas criticos:
- `GET /teams/:teamId/matches?type=last|next`
- `GET /categories/:categoryId/standings`
- `GET /categories/:categoryId/fixture`
- `GET /teams/:teamId/balance`
- `GET /teams/:teamId/stats`
- `GET /teams/:teamId/player-stats`

---

## Como trabajar este backlog

- Cerrar DPs en PRs chicas y actualizar `pending-decisions.md`.
- Resolver integraciones reales cuando haya credenciales y decisiones cerradas.
- Hacer la ola E2E por separado.
- Aprovechar refactors cuando se toque el codigo por otra razon.
