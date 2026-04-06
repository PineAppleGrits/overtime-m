# Frontend — Development Standards & Conventions

> Estas convenciones son **obligatorias**. Antes de generar o modificar código, leé este archivo
> completo y seguí cada regla al pie de la letra.
> Para los casos de uso de la plataforma, consultá `RFC.md`.

---

## 1. Arquitectura general

### Stack
- **Framework:** Next.js (App Router, Server Components por defecto)
- **Estilos:** Tailwind CSS v4 — mobile-first, sin `px` fijos salvo casos puntuales
- **Íconos:** Lucide React — nunca uses otras librerías de íconos
- **Componentes UI:** Shadcn/ui (en `/components/ui/`) — usá los existentes; si hace falta uno nuevo, seguí el mismo patrón
- **Formularios:** React Hook Form + Zod
- **Queries cliente:** TanStack React Query v5
- **Mutaciones:** Next.js Server Actions (nunca `app/api/` routes para mutaciones internas)
- **Notificaciones:** Sonner (`toast.success / toast.error`)

### Estructura de módulos
```
modules/
  [feature]/
    components/       # Componentes del módulo
    actions/          # Server Actions (archivos actions.ts)
    services/         # Clientes HTTP
    hooks/            # Custom hooks del módulo
    schemas/          # Esquemas Zod
    types.ts          # Tipos del módulo
```

### Regla de capas
```
Server Component (page.tsx)
  └─ llama a Service (server-side) para initialData
      └─ pasa initialData a Client Component
          └─ usa React Query con ese initialData
              └─ mutaciones via Server Actions
```

---

## 2. Server Components vs Client Components

- **Por defecto, toda página y layout es Server Component.**
- Usá `'use client'` **sólo** cuando necesitás: estado local, efectos, event handlers, o hooks del navegador.
- Los Server Components hacen fetch de datos directamente (no usan React Query).
- Los Client Components usan React Query para datos que necesitan actualizarse sin navegación.

### Patrón de página estándar
```tsx
// app/(page)/torneos/page.tsx — Server Component
import { TorneosContent } from '@/modules/tournament/components/TorneosContent'
import tournamentService from '@/modules/tournament/TournamentService'

async function getData() {
  try {
    const data = await tournamentService.getTournaments({ page: 1, limit: 12 })
    return { ...data, error: null }
  } catch (error) {
    return { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 1 }, error: error as Error }
  }
}

export default async function TorneosPage() {
  const initialData = await getData()
  return <TorneosContent initialData={initialData} />
}
```

```tsx
// modules/tournament/components/TorneosContent.tsx — Client Component
'use client'
import { useQuery } from '@tanstack/react-query'

export function TorneosContent({ initialData }) {
  const { data, isPending } = useQuery({
    queryKey: ['tournaments', page, search],
    queryFn: () => tournamentBrowserService.getTournaments({ page, search }),
    initialData: page === 1 && !search ? initialData : undefined,
    placeholderData: (prev) => prev,
  })
  // ...
}
```

---

## 3. Servicios HTTP

Hay **dos tipos** de cliente HTTP — no los mezcles:

| Cliente | Archivo | Dónde se usa |
|---------|---------|--------------|
| `client` (axios, SSR) | `modules/common/client/baseClient.ts` | Server Components, Server Actions |
| `browserClient` (axios, CSR) | `modules/common/client/browserClient.ts` | Client Components, React Query |

### Estructura de servicio (servidor)
```ts
// modules/[feature]/[Feature]Service.ts
import { client } from '../common/client/baseClient'
import { Service } from '../common/services/Service'

class TournamentService extends Service {
  async getTournaments(params?: PaginationParams) {
    const { data } = await this.client.get('/tournaments', { params })
    return data
  }
}

const tournamentService = new TournamentService(client)
export default tournamentService
```

### Estructura de servicio (browser)
```ts
// modules/[feature]/services/browser/[feature]Service.ts
import { browserClient } from '@/modules/common/client/browserClient'
import { BrowserService } from '@/modules/common/services/BrowserService'

class TournamentBrowserService extends BrowserService { ... }
const tournamentBrowserService = new TournamentBrowserService(browserClient)
export default tournamentBrowserService
```

---

## 4. Server Actions

- Siempre en `modules/[feature]/actions/[feature]Actions.ts`.
- Siempre con `'use server'` al inicio.
- Siempre validan el payload con Zod antes de llamar al servicio.
- Siempre retornan `ActionResult<T>` (ver `modules/admin/actions/types.ts`).
- Siempre llaman `revalidatePath(...)` al finalizar con éxito.
- **Nunca** usan `browserClient` — sólo `client` (SSR).

```ts
'use server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import service from '@/modules/[feature]/[Feature]Service'
import type { ActionResult } from '@/modules/admin/actions/types'

const schema = z.object({ name: z.string().min(1) })

export async function createXAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message }
  try {
    const result = await service.create(parsed.data)
    revalidatePath('/ruta-relevante')
    return { success: true, data: { id: result.id } }
  } catch {
    return { success: false, error: 'No se pudo completar la operación' }
  }
}
```

---

## 5. React Query (client)

- `queryKey` siempre es un array descriptivo: `['entidad', filtros...]`.
- Usar `placeholderData: (prev) => prev` para evitar parpadeo entre páginas.
- Usar `initialData` del Server Component para el primer render sin loading.
- Para mutaciones del panel admin, usar `useServerAction` (wrapper ya implementado en `modules/admin/hooks/useServerAction.ts`).
- Después de toda mutación exitosa, llamar `qc.invalidateQueries({ queryKey: [...] })` en `onSuccess`.

---

## 6. Formularios

1. Definí el schema Zod primero.
2. Inferí el tipo: `type FormData = z.infer<typeof schema>`.
3. Usá `useForm<FormData>({ resolver: zodResolver(schema) })`.
4. Los mensajes de error van en español.

```tsx
const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
})

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
})
```

---

## 7. Estados de UI

Toda sección que cargue datos **debe** implementar los 4 estados:

### Loading — usar Skeleton, no spinner de página entera
```tsx
if (isPending) return <TorneosSkeleton />
```

### Error
```tsx
if (isError) return (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <AlertCircle className="h-8 w-8 text-destructive" />
    <p className="text-muted-foreground">No se pudieron cargar los datos</p>
    <Button variant="outline" size="sm" onClick={() => refetch()}>Reintentar</Button>
  </div>
)
```

### Vacío
```tsx
if (data.length === 0) return (
  <div className="py-14 text-center">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
      <Shield className="h-6 w-6 text-white/20" />
    </div>
    <p className="text-sm font-medium text-white/50">No hay elementos todavía</p>
    <p className="mt-1 text-xs text-white/30">Texto contextual aquí.</p>
  </div>
)
```

### Sin permisos — redirigir en el Server Component
```tsx
// En page.tsx (Server Component)
const profile = await getProfile()
if (!profile || !hasAdminRole(profile)) redirect('/')
```

---

## 8. Sistema de diseño

### Colores (variables CSS custom)
| Variable | Uso |
|----------|-----|
| `ot-orange` | Accent principal, CTAs, badges activos |
| `ot-background` | Fondo global |
| `ot-dark-blue` | Cards, paneles |
| `ot-light-blue` | Bordes, separadores sutiles |
| `ot-blanco` | Texto principal |

Nunca uses colores de Tailwind directamente para elementos de marca — usá las variables `ot-*`.

### Tipografía
- `font-din-display` — headings, nombres de equipos, torneos
- `font-946-latin` — scores, números grandes (resultados de partidos)
- Default sans — cuerpo de texto

### Clases utilitarias de uso frecuente
```
Bordes:       border border-ot-light-blue/50
Cards:        rounded-xl border border-ot-light-blue/50 bg-ot-dark-blue/30
Texto muted:  text-white/50
Texto hint:   text-white/30
Input focus:  focus:ring-2 focus:ring-ot-orange/50 focus:border-ot-orange/60
CTA primario: bg-ot-orange hover:bg-ot-orange/90 text-white font-semibold rounded-lg px-4 py-2
CTA ghost:    border border-ot-orange/40 text-ot-orange hover:bg-ot-orange/10 rounded-lg px-4 py-2
```

---

## 9. Convenciones de componentes

### Nomenclatura de archivos
- Páginas: `page.tsx` (Next.js)
- Layouts: `layout.tsx`
- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Servicios: `PascalCaseService.ts`
- Actions: `camelCaseActions.ts`
- Schemas: `camelCaseSchemas.ts`

### Componentes de página (Client)
- Nombre: `[Feature]Content.tsx` (ej: `TorneosContent.tsx`)
- Reciben `initialData` del Server Component.
- Manejan toda la lógica de estado, filtros y paginación.

### Props — no sobre-abstraer
- Si un componente sólo se usa una vez, definí las props inline (no crear tipos separados).
- Si se reutiliza en 2+ lugares, exportá el tipo.

---

## 10. Autenticación

### Obtener sesión en Server Components
```ts
import { getProfile } from '@/lib/auth/session'
const profile = await getProfile()
```

### Verificar rol admin
```ts
import { hasAdminRole } from '@/lib/auth/utils' // o el helper existente
if (!hasAdminRole(profile)) redirect('/')
```

### Verificar en Client Component
```ts
// Usar el AuthContext/Provider existente
const { profile } = useAuth()
```

### Rutas protegidas
- Admin: `<AdminGuard />` ya envuelve el layout de `/admin`.
- Profile: verificar con `getProfile()` en el Server Component y redirigir si no hay sesión.

---

## 11. Panel de administración

### Convenciones específicas del admin
- Todo listado paginado usa `UserListContent` (para usuarios) o el patrón `DataTable` + React Query.
- Toda acción de CRUD usa `useServerAction` del módulo admin.
- Dialogs de confirmación destructivos usan `<ConfirmDialog />`.
- Formularios en dialogs usan `<Dialog>` de Shadcn + React Hook Form.
- Los skeleton loaders usan `<AdminTableSkeleton />`.

### Query keys del admin (convención)
```ts
['admin', 'users']
['admin', 'teams']
['admin', 'tournaments']
['admin', 'matches']
['admin', 'registrations']
// etc.
```

---

## 12. Páginas públicas

### Layout
- Toda página pública va dentro de `app/(page)/`.
- Usa el layout `(page)/layout.tsx` que incluye `<Header />` y `<Footer />`.
- Para páginas que necesitan breadcrumb, agregar el componente de breadcrumb dentro de la página.

### Imágenes
- Siempre `next/image` para imágenes optimizadas.
- Para imágenes de usuario (logos subidos) donde la URL es externa y dinámica: `<img>` con `// eslint-disable-next-line @next/next/no-img-element` si Next.js no tiene el dominio configurado.
- Nunca uses `<img>` sin el comentario eslint-disable si la alternativa es `next/image`.

---

## 13. Reglas que NUNCA se rompen

1. **No `app/api/` routes para mutaciones** — solo Server Actions.
2. **No mezclar `client` (SSR) con `browserClient` (CSR).**
3. **No hardcodear datos** — si el backend no está listo, marcar con `// TODO: conectar con API` y usar un array vacío como fallback, no datos ficticios en producción.
4. **No instalar librerías de íconos nuevas** — solo Lucide React.
5. **No usar colores Tailwind para brand** — solo variables `ot-*`.
6. **No crear abstracciones para un único uso** — tres líneas similares no justifican un helper.
7. **No omitir estados de loading y error** en cualquier componente que haga fetch.
8. **No usar `useEffect` para fetch de datos** — usar React Query o Server Components.
9. **Toda acción del admin pasa por `useServerAction`** — no llames Server Actions directamente sin el wrapper.
10. **Los textos de la UI van en español rioplatense** (vos, hacé, inscribite, etc.).
