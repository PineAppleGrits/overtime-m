# Tournament State Machine — BE & FE Plan

> Plan to formalize the tournament lifecycle. All states in English.
> This document defines the canonical state names, allowed transitions,
> automatic triggers, per-state UX, and the work needed on backend
> (NestJS + Prisma) and frontend (Next.js).

---

## 1. States

| State | Public visibility | Registration button | Fixture / Standings visible | Notes |
|---|---|---|---|---|
| `DRAFT` | Hidden | — | No | Admin-only. In preparation. |
| `PUBLISHED` | Visible | — (announcement) | No | Tournament announced. Registration not open yet. |
| `INSCRIPTION_OPEN` | Visible | **Yes — "Inscribirse"** | No | Registration window is open. |
| `INSCRIPTION_CLOSED` | Visible | "Inscripciones cerradas" badge | No | Either slots are full or `registrationEndDate` passed. |
| `IN_PROGRESS` | Visible | — | No | Admin is finalizing fixture and recategorizations. |
| `PLAYING` | Visible | — | **Yes** | Tournament started manually. Matches running. |
| `FINISHED` | Visible | — | Yes (final) | All matches + playoffs finished. Read-only. |
| `ARCHIVED` | Hidden from main lists; visible in `/torneos/archivados` | — | Yes (frozen) | Historical. |

### Legacy → new mapping

| Today (DB string) | New (enum) | Notes |
|---|---|---|
| `draft` | `DRAFT` | direct |
| `visible` | `PUBLISHED` | direct |
| `invisible` | `DRAFT` | collapse (no public visibility) |
| `inscripcion_cerrada` | `INSCRIPTION_CLOSED` | direct |
| `finalizado` | `FINISHED` | direct |
| `archivado` | `ARCHIVED` | direct |
| (none today) | `INSCRIPTION_OPEN` | new — derived from `visible + inside window` legacy logic |
| (none today) | `IN_PROGRESS` | new — admin step before "comenzar" |
| (none today) | `PLAYING` | new — manual start ("Comenzar torneo") |

For the migration, rows currently in `visible` are split: if `now` is within `[registrationStartDate, registrationEndDate]` they become `INSCRIPTION_OPEN`; otherwise stay as `PUBLISHED`.

---

## 2. Allowed transitions

```
DRAFT ──► PUBLISHED ──► INSCRIPTION_OPEN ──► INSCRIPTION_CLOSED ──► IN_PROGRESS ──► PLAYING ──► FINISHED
  ▲          │                  │                      │                                            │
  └──────────┘                  └──► INSCRIPTION_OPEN (reopen)                                      │
                                                                                                    ▼
                       (any non-ARCHIVED state) ─────────────────────────────────────────────► ARCHIVED
```

Allowed transitions table:

| From | Allowed targets | Trigger |
|---|---|---|
| `DRAFT` | `PUBLISHED`, `ARCHIVED` | manual |
| `PUBLISHED` | `DRAFT` (rollback), `INSCRIPTION_OPEN`, `ARCHIVED` | manual; **auto** to `INSCRIPTION_OPEN` when `registrationStartDate ≤ now` |
| `INSCRIPTION_OPEN` | `INSCRIPTION_CLOSED`, `ARCHIVED` | manual; **auto** to `INSCRIPTION_CLOSED` when slots full OR `registrationEndDate ≤ now` |
| `INSCRIPTION_CLOSED` | `INSCRIPTION_OPEN` (reopen — extend window), `IN_PROGRESS`, `ARCHIVED` | manual |
| `IN_PROGRESS` | `INSCRIPTION_CLOSED` (rollback), `PLAYING`, `ARCHIVED` | manual. `→ PLAYING` requires fixture published for every category. |
| `PLAYING` | `FINISHED`, `ARCHIVED` | manual; **auto** to `FINISHED` when all matches (incl. playoffs) finalized (optional, see §6) |
| `FINISHED` | `ARCHIVED` | manual |
| `ARCHIVED` | — | terminal |

Any transition outside this table returns `BusinessError(INVALID_STATE_TRANSITION)`.

---

## 3. Backend (apps/api)

### 3.1. Prisma

Replace `Tournament.status: String?` with an enum:

```prisma
enum TournamentStatus {
  DRAFT
  PUBLISHED
  INSCRIPTION_OPEN
  INSCRIPTION_CLOSED
  IN_PROGRESS
  PLAYING
  FINISHED
  ARCHIVED
}

model Tournament {
  // ...
  status TournamentStatus @default(DRAFT)
}
```

**Migration**:
- Data-migrate the existing string column to the enum following the legacy mapping above.
- Special case: `visible` rows where `now` is within the registration window become `INSCRIPTION_OPEN`. The rest become `PUBLISHED`.
- Rename `inscripcion_cerrada → INSCRIPTION_CLOSED`, etc.

### 3.2. Domain

- `TournamentStatus` enum mirrored in TS (e.g. `apps/api/src/tournaments/domain/tournament-status.ts`).
- Pure function `canTransition(from, to): boolean` using the table in §2.
- `BusinessError` codes:
  - `INVALID_STATE_TRANSITION`
  - `TOURNAMENT_NOT_OPEN_FOR_REGISTRATION`
  - `FIXTURE_NOT_PUBLISHED`
  - `FIXTURE_INCOMPLETE_FOR_START` (when admin tries `IN_PROGRESS → PLAYING` without fixture for every category)

### 3.3. Use cases

`ChangeTournamentStatusUseCase` validates `canTransition` and runs side-effect guards:

| Target | Guard |
|---|---|
| `PUBLISHED` | `registrationStartDate` and `registrationEndDate` must be set. At least one category must exist. |
| `INSCRIPTION_OPEN` | If triggered manually, override window; if auto, `now ≥ registrationStartDate`. |
| `INSCRIPTION_CLOSED` | None (admin can close at will). |
| `IN_PROGRESS` | None. Used as a parking state while admin builds fixture / recategorizes. |
| `PLAYING` | Every category must have a generated fixture (zones with matches). Otherwise `FIXTURE_INCOMPLETE_FOR_START`. |
| `FINISHED` | Manual: no guard. Auto: every match must be finalized. |
| `ARCHIVED` | Allowed from any non-archived state. No data deletion. |

The existing `change-status.use-case.ts` is the entry point — extend, don't replace.

### 3.4. Automatic transitions

A scheduled job (or `applyAutomaticStatusTransitions()` on-read) runs:
- `PUBLISHED → INSCRIPTION_OPEN` when `registrationStartDate ≤ now`.
- `INSCRIPTION_OPEN → INSCRIPTION_CLOSED` when slots full OR `registrationEndDate ≤ now`.
- (Optional, §6) `PLAYING → FINISHED` when last match finalized.

Manual transitions always take precedence and are not undone by the job.

### 3.5. Endpoints

- `PATCH /tournaments/:id/status` — body `{ status: TournamentStatus }`. Validates via `canTransition` + guards.
- `GET /tournaments` — for non-admin tokens, excludes `DRAFT` and `ARCHIVED` by default. Accepts `?status=ARCHIVED` to list archived tournaments (still public-readable).
- `GET /tournaments/by-slug/:slug` — non-admin: 404 if `DRAFT`.
- `GET /tournaments/by-slug/:slug/categories/:categorySlug` — non-admin: when tournament is in any pre-`PLAYING` state, the response omits `fixture` and `standings` arrays (or returns them empty so the FE can branch).
- `GET /tournaments/categories/:id/fixture` and `/standings` — return 409 `FIXTURE_NOT_PUBLISHED` for non-admin if tournament is in any state earlier than `PLAYING`.
- `POST /registrations` — reject with `TOURNAMENT_NOT_OPEN_FOR_REGISTRATION` unless tournament is `INSCRIPTION_OPEN`.

### 3.6. Tests

- `change-status.use-case.spec.ts` — one test per allowed transition + one per forbidden transition + each guard.
- Integration: `INSCRIPTION_OPEN` tournament accepts registration; `INSCRIPTION_CLOSED` rejects.
- Integration: fixture endpoint gated for `INSCRIPTION_CLOSED` / `IN_PROGRESS`.
- Integration: auto-transition job moves `PUBLISHED → INSCRIPTION_OPEN` past start date.

---

## 4. Frontend (apps/web)

### 4.1. Constants & helpers

`apps/web/modules/tournament/constants.ts` (already exists) — replace the loose union with canonical enum keys matching the BE enum exactly:

```ts
export const TOURNAMENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  INSCRIPTION_OPEN: 'INSCRIPTION_OPEN',
  INSCRIPTION_CLOSED: 'INSCRIPTION_CLOSED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAYING: 'PLAYING',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED',
} as const
```

Helpers:
- `isPubliclyVisibleTournament(t)` — excludes `DRAFT` and `ARCHIVED`.
- `isRegistrationOpen(status)` — `status === INSCRIPTION_OPEN`.
- `hasPublicFixture(status)` — `status ∈ { PLAYING, FINISHED, ARCHIVED }`.
- `isLiveOrPast(status)` — same as above (alias for readability when used to show stats).

### 4.2. Public listings

- `Header.tsx` and `ListOfTournaments.tsx` — keep using `isPubliclyVisibleTournament` (already in place).
- New page `/torneos/archivados` — calls `getTournaments({ status: 'ARCHIVED' })`. Link "Ver torneos archivados" added to `/torneos`.

### 4.3. Category detail page (`app/(page)/torneos/[t]/[c]/page.tsx`)

Behavior matrix:

| Tournament status | Page behavior |
|---|---|
| `DRAFT` | 404 (non-admin). |
| `PUBLISHED` | Show "Próximamente — inscripciones desde DD/MM". Tabs fixture/posiciones hidden. |
| `INSCRIPTION_OPEN` | Prominent **"Inscribirse"** CTA. Banner with end date. Tabs hidden. |
| `INSCRIPTION_CLOSED` | Banner "Inscripciones cerradas". Tabs hidden. |
| `IN_PROGRESS` | Banner "Próximamente comienza el torneo". Tabs hidden. |
| `PLAYING` | Tabs fixture/posiciones visible. |
| `FINISHED` | Tabs fixture/posiciones visible (final). Banner "Torneo finalizado". |
| `ARCHIVED` | Same as `FINISHED` but with "Archivado" badge. Only reachable from the archive page. |

`CategoryDetailContent.tsx` already receives `tournamentStatus` indirectly — add an explicit `tournamentStatus: TournamentStatus` prop and branch on it.

### 4.4. Registration page

`app/(page)/torneos/[t]/[c]/inscribirse/page.tsx`:
- If `status !== INSCRIPTION_OPEN`, redirect back to the category page (server-side).
- Show `ErrorState` for fetch failures (already in place pattern).

### 4.5. Admin: status transitions

In `EditTournamentContent.tsx`, replace the current "change status" select with explicit buttons keyed off `canTransition(currentStatus)`:

| Current | Buttons shown |
|---|---|
| `DRAFT` | "Publicar" |
| `PUBLISHED` | "Volver a borrador", "Abrir inscripciones" |
| `INSCRIPTION_OPEN` | "Cerrar inscripciones" |
| `INSCRIPTION_CLOSED` | "Reabrir inscripciones", "Pasar a armado" (→ `IN_PROGRESS`) |
| `IN_PROGRESS` | "Volver a inscripción cerrada", **"Comenzar torneo"** (→ `PLAYING`, requires fixture) |
| `PLAYING` | "Finalizar" |
| `FINISHED` | "Archivar" |
| `ARCHIVED` | (none — terminal) |

All states also expose a secondary "Archivar" button (except `ARCHIVED`).

All transitions go through `useServerAction` with loading/success/error toasts (already wired). When `→ PLAYING` fails with `FIXTURE_INCOMPLETE_FOR_START`, the toast surfaces a "Faltan fixtures por generar" message.

### 4.6. Error catalog

`modules/common/errors/codes.ts` — add:
- `INVALID_STATE_TRANSITION` → "No se puede pasar a ese estado desde el actual."
- `TOURNAMENT_NOT_OPEN_FOR_REGISTRATION` → "La inscripción no está abierta para este torneo."
- `FIXTURE_NOT_PUBLISHED` → "El fixture todavía no está publicado."
- `FIXTURE_INCOMPLETE_FOR_START` → "Faltan fixtures por generar en algunas categorías."

### 4.7. Shared types

`packages/shared` — export `TournamentStatus` enum so BE and FE consume the same source of truth. Today the FE redeclares the union; this is the moment to unify.

---

## 5. Implementation order (suggested)

1. **BE:** Prisma enum + data migration (legacy strings → enum). Includes the smart split for `visible` based on registration window.
2. **BE:** `canTransition` + extend `change-status.use-case` with guards. Tests.
3. **BE:** Automatic transition job (`PUBLISHED → INSCRIPTION_OPEN`, `INSCRIPTION_OPEN → INSCRIPTION_CLOSED`).
4. **Shared types:** export `TournamentStatus` from `packages/shared`.
5. **FE constants:** consume the shared enum, update filters/helpers.
6. **FE admin:** rewrite the status panel with explicit transition buttons + `FIXTURE_INCOMPLETE_FOR_START` handling.
7. **FE public category page:** branch UX on status (§4.3 matrix).
8. **FE registration gating:** redirect when status is not `INSCRIPTION_OPEN`.
9. **BE endpoint gating:** hide fixture/standings unless `PLAYING | FINISHED | ARCHIVED`.
10. **FE archive page:** `/torneos/archivados` + link from `/torneos`.
11. **Cleanup:** remove legacy lowercase strings from seed / fixtures.

Each step ships independently; steps 4-onward depend on (1) landing.

---

## 6. Open questions

- **Auto-finish `PLAYING → FINISHED`** when last match (incl. playoffs) is finalized — yes or stay manual?
- **Re-publish after archive** — is `ARCHIVED` truly terminal, or should there be an "Unarchive" path back to `FINISHED`?
- **Recategorización**: confirmed that team moves between categories happen during `INSCRIPTION_CLOSED` or `IN_PROGRESS`. No status changes — just admin operations on registrations. No additional state needed.
- **`IN_PROGRESS` vs `INSCRIPTION_CLOSED`**: both are "no public fixture yet", admin-prep states. Keep both? My take: yes — `INSCRIPTION_CLOSED` is the immediate state after closing, `IN_PROGRESS` is when admin actively starts building the fixture. The boundary signals to the org that "we're ready to start arming this". Drop one only if it adds no operational value.
