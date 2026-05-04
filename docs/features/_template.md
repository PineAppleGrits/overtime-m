# Feature: <nombre>

> Plantilla — copiar a `docs/features/<entidad>.md` al implementar la feature.
> Sustituir `<entidad>` por el nombre real (ej. `tournaments`, `debts`, `friendlies`).

## Casos de uso

Lista numerada con el caso de uso en imperativo + breve descripción.

1. **Crear X** — descripción breve.
2. **Aprobar X** — ...
3. **Listar X por filtro Y** — ...
4. **Eliminar X (soft)** — ...

## Reglas de negocio aplicables

| RN | Tema | Origen |
|----|------|--------|
| RN-XXX | ... | docs/business-rules/<file>.md |

## Modelo

### Entidad principal
- **Tabla**: `<table_name>`
- **Campos relevantes**: lista breve.
- **Relaciones**: con qué otras entidades se conecta.

### Estados y transiciones (si aplica)

```
PENDING ──(approve)──> APPROVED ──(pay)──> PAID
   │                       │
   └──(reject)──> REJECTED └──(cancel)──> CANCELLED
```

## Endpoints

Tabla resumen:

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST   | /api/v1/xxx | admin | Crear xxx |
| GET    | /api/v1/xxx | public | Listar xxx |
| GET    | /api/v1/xxx/:id | public | Ver detalle |
| PATCH  | /api/v1/xxx/:id | admin | Actualizar |
| DELETE | /api/v1/xxx/:id | admin | Soft-delete |

### POST /api/v1/xxx

- **Auth**: `admin`.
- **Request body**:
  ```ts
  {
    name: string
    sportId: string
    // ...
  }
  ```
- **Response 201**:
  ```ts
  {
    id: string
    name: string
    // ...
  }
  ```
- **Errores**:
  | HTTP | Code | Cuándo |
  |------|------|--------|
  | 400 | VALIDATION_FAILED | Body inválido |
  | 409 | REGISTRATION_DUPLICATE | Ya existe |
- **RN aplicadas**: RN-XXX, RN-YYY.
- **Eventos disparados**: `<entity>.created`.

### GET /api/v1/xxx

...

## Casos especiales

- **Caso edge 1**: cómo se maneja.
- **Caso edge 2**: cómo se maneja.

## Eventos del dominio

Eventos que esta feature **emite**:
- `<entity>.created` — payload.
- `<entity>.approved` — payload.

Eventos que esta feature **escucha** (de otras features):
- `<otherEntity>.event` — qué hace al recibirlo.

## Errores específicos

Códigos agregados a `ErrorCode` por esta feature:
- `XXX_YYY_ZZZ` — descripción.

## Pendientes / TODOs

Referencias a DPs abiertas en `docs/pending-decisions.md`:
- DP-XXX: descripción y cómo se aplica el default mientras tanto.
