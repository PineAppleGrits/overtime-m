# Progreso de Implementación — Cierre de Backend

Tracking persistente del avance del plan en `docs/implementation-plan.md`. Se actualiza al completar cada subtask para que el trabajo pueda retomarse en sesiones nuevas.

**Última actualización**: 2026-05-03 (Ola 3 primer batch mergeado, segundo batch lanzado)

---

## Estado general

| Ola | Estado | Branch / PR |
|-----|--------|-------------|
| Ola 0 — PR0 Foundation | 🟢 MERGEADA | PR #5 → main `809e295` |
| Ola 1 — W1.1 Tournaments | 🟢 MERGEADA | PR #6 → main `fc001a9` |
| Ola 1 — W1.2/W1.3/W1.4 (batch) | 🟢 MERGEADA | PR #7 → main `8b3b50c` |
| Ola 2 — W2.3 Pricing & Discounts | 🟢 MERGEADA | PR #8 → main `f80bffb` |
| Ola 2 — W2.1 Debts + crons | 🟢 MERGEADA | PR #9 → main `a0915e0` |
| Ola 2 — W2.2 Payments completion | 🟢 MERGEADA | PR #10 → main `e698a45` |
| Ola 3 — W3.2 Staff completion | 🟢 MERGEADA | PR #11 → main `1fcfcfe` |
| Ola 3 — W3.1 Match lifecycle + Playoffs | 🟢 MERGEADA | PR #12 → main `c346f66` |
| Ola 3 — W3.3 Eligibility + Sanctions | 🟡 IN PROGRESS | `feat/api/eligibility-sanctions` |
| Ola 3 — W3.4 Notifications + Users | 🟡 IN PROGRESS | `feat/api/notifications-users` |

Leyenda: ⚪ pendiente · 🟡 en curso · 🟢 mergeada · 🔴 bloqueada

---

## Ola 0 — PR0 Foundation

**Branch**: `feat/api/foundation-pr0`
**Owner**: Claude Opus (main thread)

### Checklist

- [x] **0.1** Schema Prisma — modelos nuevos: MediaAsset, Debt, DebtAudit, CategoryLevel, TeamCategoryLevel, Friendly, PlayoffSeries
- [x] **0.2** Schema Prisma — modificaciones a existentes: Tournament, Category, Match, Payment, Profile, Team
- [x] **0.3** Migración Prisma generada (offline diff)
- [x] **0.4** Instalar `@nestjs/event-emitter` + `openapi-typescript` (devDependency)
- [x] **0.5** `apps/api/src/common/storage/` — Supabase storage adapter + MediaAsset service
- [x] **0.6** `apps/api/src/common/sport-rules/` — registry + interfaces + Basketball5v5/3v3 strategies
- [x] **0.7** `apps/api/src/common/errors/` — ErrorCode enum + BusinessError + filter actualizado
- [x] **0.8** `apps/api/src/common/cron/` — advisory lock service + base class
- [x] **0.9** `apps/api/src/common/events/` — domain-events namespace + EventEmitterModule en AppModule
- [x] **0.10** `packages/shared/` — DTOs nuevos (sport, debt, playoff, friendly, media, category-level) + ErrorCode re-export
- [x] **0.11** Script `pnpm generate:api-types` (root + api package.json)
- [x] **0.12** CI básico — `.github/workflows/ci.yml` (lint + typecheck + build + jest)
- [x] **0.13** Plantilla `docs/features/_template.md`
- [x] **0.14** Doc `docs/features/foundation.md` describiendo qué expone PR0
- [x] **0.15** Verificar build limpio (`turbo build`) + tests existentes pasan (49/49)
- [x] **0.16** Commit final (`4414bc8`) + push a `origin/feat/api/foundation-pr0`. PR a abrir desde GitHub UI.

### Notas de continuación

Si se reinicia la sesión, retomar revisando este checklist y ejecutando el primer ítem sin marcar.

---

## Olas 1-3 — Worktrees paralelos

A iniciar **después de mergear PR0**. Detalle de scope, RNs y entregables por worktree en `docs/implementation-plan.md`.

### Ola 1
- [x] W1.1 Tournaments completion (PR #6, mergeada)
- [x] W1.2 Categories + Zones completion (incluida en PR #7)
- [x] W1.3 Teams + Categorización (incluida en PR #7)
- [x] W1.4 Friendlies (incluida en PR #7)

### Ola 2
- [x] W2.1 Debts module + cron (PR #9, mergeada)
- [x] W2.2 Payments completion (PR #10, mergeada)
- [x] W2.3 Pricing & Discounts (PR #8, mergeada)

### Ola 3
- [x] W3.1 Match lifecycle + Playoffs (PR #12, mergeada)
- [x] W3.2 Staff completion (PR #11, mergeada)
- [ ] W3.3 Eligibility + Sanctions — IN PROGRESS (background agent)
- [ ] W3.4 Notifications + Users — IN PROGRESS (background agent)

### Ola 3
- [ ] W3.1 Match lifecycle + Playoffs
- [ ] W3.2 Staff completion
- [ ] W3.3 Eligibility + Sanctions
- [ ] W3.4 Notifications wiring + Users completion

---

## Cómo retomar tras un reinicio

1. Leer este archivo para identificar el primer ítem sin marcar.
2. Leer `docs/implementation-plan.md` para contexto completo.
3. Verificar branch actual: si es PR0, seguir el checklist. Si PR0 ya está mergeada, levantar la siguiente ola.
4. Las decisiones consolidadas viven en `memory/project_backend_completion_plan.md`.
