# Feature: staff

> Owner: W3.2 — `feat/api/staff-completion`. Cubre RN-049, RN-050, RN-051, RN-030.

## Casos de uso

1. **Crear staff (admin)** — `POST /api/v1/staff`. Tipo (`referee`, `table_official`, `photographer`), nombre, contacto. Valida que un `profileId` no esté ya tomado.
2. **Listar staff (público)** — `GET /api/v1/staff?type=&isActive=&page=&limit=`. Conteo de asignaciones incluido.
3. **Detalle (público)** — `GET /api/v1/staff/:id`.
4. **Actualizar (admin)** — `PATCH /api/v1/staff/:id`.
5. **Eliminar (admin, soft)** — `DELETE /api/v1/staff/:id`.
6. **Configurar disponibilidad (admin)** — `POST /api/v1/staff/:id/availability` con `{ availability: [{ dayOfWeek, startTime, endTime }] }`. Reemplaza por completo. Valida sin overlaps por día.
7. **Listar partidos asignados** — `GET /api/v1/staff/:id/matches?status=`. Devuelve `MatchStaff` activos con info del partido.
8. **Buscar staff disponible (admin)** — `GET /api/v1/staff/available?date=&type=&excludeBusy=`. Cruza `StaffAvailability` (dayOfWeek + slot que cubre la hora) con la fecha pedida y, por default, excluye staff con asignaciones en partidos a la misma fecha+hora.
9. **Asignar staff a partido (admin) — RN-050** — `POST /api/v1/staff/matches/:matchId/assign` con `{ staffId, role }`. Valida tipo del staff, disponibilidad horaria y conflicto de horario con otros partidos.
10. **Asignar batch (admin) — RN-050** — `POST /api/v1/staff/matches/batch-assign` con `{ assignments: [...] }`. Best-effort: errores no abortan el resto.
11. **Remover staff de partido** — `DELETE /api/v1/staff/matches/:matchId/staff/:staffId`.
12. **Calcular AJC (admin) — RN-030** — `POST /api/v1/staff/ajc/compute` con `{ refereeSalary, fechasToFree }`. Preview, no persiste.
13. **Aplicar AJC (admin) — RN-030** — `POST /api/v1/staff/ajc/apply` con `{ profileId, sanctionId, refereeSalary, fechasToFree, sanctionTotalFechas? }`. Valida sanción, calcula monto, crea `Debt(type=AJC_FEE)` via W2.1, anota la sanción y emite `sanction.ajc.applied`.
14. **Crear carpeta Drive del partido (admin) — RN-051** — `POST /api/v1/staff/matches/:matchId/photo-folder`. También se crea automáticamente al iniciar el partido (listener `match.started`) si hay fotógrafo asignado.

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-049 | Staff mínimo para habilitar el partido | docs/business-rules/matches.md |
| RN-050 | Asignación admin de staff | docs/business-rules/matches.md |
| RN-051 | Multimedia / carpeta Drive | docs/business-rules/matches.md |
| RN-030 | AJC (habilitación anticipada) | docs/business-rules/fines.md |

## Modelo

### Entidades

- `Staff` (`staff`): persona del personal. `type ∈ {referee, table_official, photographer}`, `isActive`, soft-delete.
- `StaffAvailability` (`staff_availability`): franjas semanales (`dayOfWeek` 0..6, `startTime`/`endTime` HH:mm).
- `MatchStaff` (`match_staff`): asignación staff↔partido. `status ∈ {assigned, applied, rejected}`, `assignedBy`.
- `Debt` (W2.1): el AJC se materializa como `Debt(type=AJC_FEE)` con `metadata = { refereeSalary, fechasFreed, sanctionId }`.
- `Sanction`: el adapter anota en `notes` el rastro AJC (no hay campo metadata jsonb en schema actual).
- `MatchAnnouncement`: persiste el `folderUrl` de Drive con `type='photo_folder_created'`.

### Arquitectura (clean)

```
apps/api/src/staff/
├── domain/
│   ├── entities/staff.entity.ts
│   └── rules/
│       ├── ajc-formula.rules.ts (RN-030 — fórmula pura)
│       └── availability.rules.ts (overlap, slot coverage)
├── application/
│   ├── ports/
│   │   ├── staff-repository.port.ts
│   │   ├── staff-availability-repository.port.ts
│   │   ├── match-staff-repository.port.ts
│   │   ├── drive.port.ts
│   │   ├── debts.port.ts
│   │   ├── sanctions.port.ts
│   │   └── match-context.port.ts
│   ├── services/staff.service.ts (facade exportado)
│   └── use-cases/
│       ├── create-staff, update-staff, delete-staff, get-staff
│       ├── set-availability, find-available-staff
│       ├── assign-to-match, batch-assign-to-matches
│       ├── remove-from-match, get-assigned-matches
│       ├── validate-min-staff (RN-049)
│       ├── compute-ajc-fee, apply-ajc (RN-030)
│       └── create-match-photo-folder (RN-051)
├── infrastructure/
│   ├── repositories/{prisma-staff,prisma-staff-availability,prisma-match-staff}.repository.ts
│   ├── adapters/{google-drive (stub), debts, sanctions, match-context}.adapter.ts
│   └── listeners/match-started.listener.ts (RN-051)
├── presentation/
│   ├── controllers/staff.controller.ts
│   ├── dto/{ajc,photo-folder}.dto.ts
│   └── mappers/staff.mapper.ts
└── staff.module.ts
```

### Estados de `MatchStaff`

```
(creación admin) ──> assigned ──┬──> applied (cuando staff confirma — futuro)
                                └──> rejected (cuando staff declina — futuro)
```

`status='assigned'` y `status='applied'` cuentan como activos para conflict detection y RN-049. Today el FE solo crea `assigned`; los otros estados quedan modelados para el flujo coordinador (RN-050 — evolución).

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/staff | admin | Crear staff |
| GET    | /api/v1/staff | public | Listar staff |
| GET    | /api/v1/staff/available | admin | Staff disponible (RN-050) |
| GET    | /api/v1/staff/:id | public | Ver detalle |
| PATCH  | /api/v1/staff/:id | admin | Actualizar |
| DELETE | /api/v1/staff/:id | admin | Soft-delete |
| POST   | /api/v1/staff/:id/availability | admin | Configurar franjas |
| GET    | /api/v1/staff/:id/matches | auth | Partidos asignados |
| POST   | /api/v1/staff/matches/:matchId/assign | admin | Asignar a partido (RN-050) |
| POST   | /api/v1/staff/matches/batch-assign | admin | Asignación masiva |
| DELETE | /api/v1/staff/matches/:matchId/staff/:staffId | admin | Quitar asignación |
| POST   | /api/v1/staff/ajc/compute | admin | Calcular AJC (preview, RN-030) |
| POST   | /api/v1/staff/ajc/apply | admin | Aplicar AJC y crear Debt (RN-030) |
| POST   | /api/v1/staff/matches/:matchId/photo-folder | admin | Crear carpeta Drive manualmente (RN-051) |

### POST /api/v1/staff/ajc/apply (RN-030)

- **Auth**: `admin` o `master`.
- **Request body**:
  ```ts
  {
    profileId: string;        // jugador suspendido
    sanctionId: string;       // sanción DISCIPLINARY activa
    refereeSalary: number;    // ARS — sueldo árbitro/partido
    fechasToFree: number;     // entero > 0
    sanctionTotalFechas?: number; // opcional, valida no exceder
  }
  ```
- **Response 201**:
  ```ts
  {
    debtId: string;
    amount: number;
    fechasFreed: number;
    sanctionId: string;
  }
  ```
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | refereeSalary ≤ 0 |
  | 400 | AJC_INVALID_FECHAS | fechasToFree ≤ 0 o > sanctionTotalFechas |
  | 400 | AJC_INVALID_SANCTION | Sanción no DISCIPLINARY, no ACTIVE, vencida o de otro perfil |
  | 404 | NOT_FOUND | Sanción no existe |
- **RN aplicadas**: RN-030.
- **Eventos disparados**: `debt.created` (W2.1), `sanction.ajc.applied`.

### POST /api/v1/staff/ajc/compute

Mismo body, pero solo retorna `{ amount, refereeSalary, fechasToFree }` sin persistir. Útil como preview en el FE.

## Casos especiales

- **Sueldo del árbitro sin schema**: el sueldo NO está en `Staff` ni en `Tournament` (decisión: no modificamos schema). Se pasa como input al endpoint AJC y queda registrado en `Debt.metadata.refereeSalary`. Cuando aparezca un schema para "salary" (config por torneo), el use-case migra a leerlo de ahí sin cambiar la signature pública.
- **Sanción metadata sin jsonb**: `Sanction` no tiene `metadata`. El adapter anexa al campo `notes` un line stamp `[AJC <ts>] fechasFreed=N refereeSalary=$X amount=$Y debtId=… appliedBy=…`. La info estructurada vive en `Debt.metadata`.
- **Drive folder creator**: `MatchAnnouncement.createdBy` es FK a `Profile`. Si el fotógrafo no tiene `profileId` vinculado, el listener cae a un admin existente para no fallar la FK.
- **Conflict horario**: `assign-to-match` chequea otros `MatchStaff` del staff con `status ∈ {assigned, applied}` y `match.matchDate + matchTime` exactamente iguales (excluye el partido objetivo). No detecta superposiciones parciales — solo identidad de fecha/hora. Suficiente porque el reloj de partido es discreto.

## Eventos del dominio

Esta feature **emite**:
- `match.staff.assigned` — `{ matchId, staffId, role }`. Tras `AssignToMatchUseCase`.
- `match.photoFolder.created` — `{ matchId, folderId, folderUrl }`. Tras crear la carpeta Drive.
- `sanction.ajc.applied` — `{ sanctionId, profileId, debtId, refereeSalary, fechasFreed, amount, appliedBy }`. Tras `ApplyAjcUseCase`.

Esta feature **escucha**:
- `match.started` (W3.1) — Si el match tiene fotógrafo asignado, ejecuta `CreateMatchPhotoFolderUseCase` (RN-051).

## Errores específicos

Códigos agregados a `ErrorCode`:
- `STAFF_NOT_FOUND` — staff no existe.
- `STAFF_NOT_AVAILABLE` — sin slot horario que cubra el partido.
- `STAFF_HAS_CONFLICT` — ya asignado a otro partido a la misma fecha/hora.
- `STAFF_TYPE_ROLE_MISMATCH` — `Staff.type` ≠ `MatchStaff.role` o staff inactivo.
- `STAFF_ALREADY_ASSIGNED` — ya está asignado al mismo partido con el mismo rol.
- `AJC_INVALID_SANCTION` — sanción inválida para AJC (kind, status, owner, vencida).
- `AJC_INVALID_FECHAS` — fechasToFree no positivo o excede el total.
- `MATCH_STAFF_BELOW_MIN` (preexistente) — usado por W3.1 al consumir `validateMatchStaffMinimum`.

## Integración con W3.1 — RN-049

`StaffService.validateMatchStaffMinimum(matchId, sportCode, modality)` retorna:
```ts
{
  valid: boolean,
  missing: Array<{ role, required, current, missing }>,
  current: Array<{ role, count }>,
}
```

Cuenta `referee` y `table_official` con `status ∈ {assigned, applied}` y compara con `SportRulesRegistry.get(sport, modality).staff.{minReferees,minTableOfficials}`. El caller (W3.1 — start-match) interpreta `valid=false` y lanza `BusinessError(ErrorCode.MATCH_STAFF_BELOW_MIN)`.

## Pendientes / TODOs

- **DP-007** — cantidad mínima de fechas cumplidas para habilitar AJC. Mientras está abierta, NO bloqueamos por ese chequeo en `ApplyAjcUseCase`. Marcado con `// TODO: DP-007`.
- **DP-015** — formato del nombre de carpeta Drive. Mientras está abierta, usamos `{tournamentSlug}/{categorySlug}/{YYYY-MM-DD}/{home-slug}-vs-{away-slug}`. Marcado con `// TODO: DP-015`.
- **GoogleDriveAdapter es STUB** — loguea y retorna `folderId='stub-${matchId}'`. La integración real requiere service account credentials y manejo de carpeta padre por torneo.
- **SanctionsAdapter directo a Prisma** — cuando W3.3 (Eligibility + Sanctions) madure, el adapter pasa a usar `SanctionsService` sin cambiar el contrato.
- **Sueldo del árbitro como parámetro del endpoint** — si en el futuro se requiere persistirlo por torneo o por staff, se agrega un nuevo modelo y el endpoint lo lee como default. La signature pública de `applyAjc` no cambia.
