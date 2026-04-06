# RFC — Frontend: Casos de Uso de la Plataforma Overtime

> **Alcance:** Frontend únicamente. Las integraciones con el backend se describen como contratos
> de datos esperados. Toda la UI debe implementarse como si el backend respondiera correctamente.
>
> **Última revisión:** 2026-03-31

---

## 1. Actores del sistema

| Actor | Descripción |
|-------|-------------|
| **Anónimo** | Visitante sin sesión. Puede explorar torneos, equipos y partidos. |
| **Jugador** | Usuario autenticado con rol `player`. Tiene perfil, equipo y puede inscribirse. |
| **Delegado** | Jugador que es capitán de al menos un equipo. Puede gestionar su plantel. |
| **Dueño de franquicia** | Jugador que creó una franquicia. Puede agregar equipos a ella. |
| **Árbitro** | Staff con rol `referee`. Ve partidos asignados. |
| **Fotógrafo** | Staff con rol `photographer`. Ve partidos asignados. |
| **Oficial de mesa** | Staff con rol `official`. Carga estadísticas en partido. |
| **Admin** | Rol `admin`. Gestiona todo el contenido de la plataforma. |
| **Master** | Rol `master`. Igual que admin + puede modificar configuración global. |

---

## 2. Flujos de autenticación

### UC-AUTH-01 · Login con Google
- **Actor:** Anónimo
- **Ruta:** `/auth/login`
- **Flujo:** Click en "Entrar con Google" → OAuth Google → redirect a `/auth/callback` → si tiene perfil completo → `/` ; si es primera vez → `/profile` para completar DNI.
- **Estados:** loading del botón durante el redirect, error si falla OAuth.
- **Dato esperado del callback:** sesión de Supabase con `access_token`.

### UC-AUTH-02 · Registro de DNI (primera vez)
- **Actor:** Jugador (nuevo)
- **Ruta:** `/profile` (sección de datos personales)
- **Flujo:** Usuario recién registrado → pantalla de completar perfil → ingresa nombre, DNI, fecha de nacimiento, teléfono → submit → redirect a `/profile/equipos`.
- **Validación:** DNI sólo puede registrarse una vez; una vez guardado se muestra como read-only con "Solicitar cambio al administrador".
- **Dato esperado:** `PATCH /profiles/:id` con `{ documentNumber, dateOfBirth, phone }`.

### UC-AUTH-03 · Logout
- **Actor:** Cualquier autenticado
- **Flujo:** Click en "Cerrar sesión" (header o sidebar) → `supabase.auth.signOut()` → redirect a `/`.

---

## 3. Landing y navegación pública

### UC-PUB-01 · Landing page
- **Ruta:** `/`
- **Contenido:**
  - Hero: título, descripción, CTA "Ver torneos" + "Crear equipo" (si no está logueado, el segundo lleva a login).
  - Sección "Torneos activos": card preview de los 3 torneos más recientes con nombre, categorías y fecha límite de inscripción.
  - Sección "Cómo funciona": pasos visuales (creá tu equipo → elegí torneo → jugá).
  - Footer con links.
- **Datos:** `GET /tournaments?status=visible&limit=3`.

### UC-PUB-02 · Listado de torneos
- **Ruta:** `/torneos`
- **Contenido:**
  - Grid/lista de torneos con card: nombre, imagen, disciplina, cantidad de categorías, fechas de inscripción, estado.
  - Filtro por disciplina (sidebar o chips).
  - Búsqueda por nombre (debounced).
  - Paginación.
- **Estado vacío:** "No hay torneos disponibles en este momento."
- **Datos:** `GET /tournaments?status=visible&page=X&limit=12&sport=X&search=X`.

### UC-PUB-03 · Detalle de torneo
- **Ruta:** `/torneos/[tournamentSlug]`
- **Contenido:**
  - Header: banner/imagen, nombre, disciplina, fechas.
  - Lista de categorías: nombre, descripción, cupos disponibles, estado de inscripción.
  - Cada categoría linkea a `/torneos/[tournamentSlug]/[categorySlug]`.
- **Datos:** `GET /tournaments/:slug` → incluye `categories[]`.

### UC-PUB-04 · Detalle de categoría
- **Ruta:** `/torneos/[tournamentSlug]/[categorySlug]`
- **Contenido:**
  - Info de la categoría: nombre, requisitos de edad, disciplina.
  - Inscripción: CTA "Inscribir mi equipo" (requiere login + tener equipo).
  - Zonas con equipos inscriptos y cupos.
  - Fixture si el torneo ya comenzó.
- **Condicionales:**
  - Si no está logueado: CTA "Ingresá para inscribirte".
  - Si está logueado sin equipo: "Primero creá un equipo".
  - Si ya tiene inscripción en esta categoría: mostrar estado (pendiente / aprobada / rechazada).
  - Si el período de inscripción cerró: mostrar "Inscripciones cerradas".
- **Datos:** `GET /tournaments/:slug/categories/:categorySlug`.

### UC-PUB-05 · Inscripción a categoría
- **Ruta:** `/torneos/[tournamentSlug]/[categorySlug]/inscribirse`
- **Flujo:** Seleccionar equipo del usuario → confirmar jugadores → pagar (si aplica) → submit → estado "Pendiente de aprobación".
- **Validaciones:** el equipo debe cumplir los requisitos de edad de la categoría; el jugador no puede estar en otra inscripción de la misma categoría.
- **Datos:** `POST /registrations` con `{ teamId, categoryId }`.

### UC-PUB-06 · Perfil público de equipo
- **Ruta:** `/equipos/[id]`
- **Contenido:**
  - Header: logo, nombre, franquicia (si aplica), disciplina, capitán.
  - Roster de jugadores: foto, nombre, número, posición.
  - Torneos activos: categorías en las que compite.
  - Últimos partidos: resultado, rival, fecha.
  - Próximos partidos: rival, fecha, cancha.
- **Datos:** `GET /teams/:id` con relaciones `members`, `franchise`, `registrations`, `homeMatches`, `awayMatches`.

### UC-PUB-07 · Detalle de partido
- **Ruta:** `/torneos/[tournamentSlug]/[categorySlug]/partido/[matchId]`
  - Alternativamente: `/partidos/[matchId]` para acceso directo.
- **Contenido:**
  - Header del partido: vs, resultado final, fecha, cancha, árbitro.
  - Estadísticas por equipo: tabla de jugadores con pts, FG%, 3P%, rebotes, asistencias, robos, faltas.
  - Galería de fotos (link a carpeta de Google Drive o carrusel).
  - Video del partido (YouTube embed si existe).
- **Estados:** si el partido no tiene resultado → mostrar "Partido no disputado aún" con la fecha y hora programada.
- **Datos:** `GET /matches/:id` con `playerStats[]`, `homeTeam`, `awayTeam`, `venue`, `referees[]`.

---

## 4. Perfil del usuario

### UC-PROFILE-01 · Ver y editar perfil personal
- **Ruta:** `/profile`
- **Contenido:**
  - Avatar (photo de Google o placeholder con inicial).
  - Nombre (editable).
  - Email (readonly — viene de Google).
  - Teléfono (editable).
  - DNI / Número de documento:
    - Si no tiene: formulario de carga.
    - Si tiene: valor visible + badge "Verificado" + texto "Para modificarlo contactá al administrador".
  - Fecha de nacimiento (editable hasta que se vincule a una inscripción).
  - Estado en lista negra: si está suspendido, banner prominente con la razón.
- **Datos:** `GET /profiles/me`, `PATCH /profiles/me`.

### UC-PROFILE-02 · Mis equipos
- **Ruta:** `/profile/equipos`
- **Contenido (ya implementado — extender según este RFC):**
  - Sección "Franquicias": cada franquicia como card principal con sus equipos hijos.
  - Sección "Equipos independientes": equipos sin franquicia.
  - Cada equipo: logo, nombre, disciplina, cantidad de jugadores, badge "Delegado" si es capitán, botón "Abandonar" si no es creador.
  - CTA "Crear equipo" que lleva al wizard.
- **Acciones disponibles:**
  - Entrar al perfil del equipo (link a `/equipos/[id]`).
  - Abandonar equipo (no disponible si es creador).
  - Si es delegado: link a gestión del equipo.

### UC-PROFILE-03 · Gestión de equipo (delegado/creador)
- **Ruta:** `/equipos/[id]/gestionar` (o dentro del perfil de equipo con permisos)
- **Contenido:**
  - Editar nombre, logo, disciplina.
  - Ver/editar roster: agregar/remover jugadores.
  - Asignar capitán.
  - Ver estado de inscripciones activas.
  - Si es dueño de franquicia: opción de agregar otro equipo a la franquicia.
- **Datos:** `PATCH /teams/:id`, `POST /teams/:id/players`, `DELETE /teams/:id/players/:playerId`, `PATCH /teams/:id/captain/:playerId`.

### UC-PROFILE-04 · Mis torneos
- **Ruta:** `/profile/torneos`
- **Contenido:**
  - Lista de inscripciones del usuario (a través de sus equipos).
  - Cada inscripción: torneo, categoría, equipo, estado (pendiente / aprobada / rechazada), fecha.
  - Si está aprobada: link al fixture de la categoría.
  - Si está rechazada: razón del rechazo.
- **Datos:** `GET /registrations?profileId=me`.

---

## 5. Staff — Mis partidos

### UC-STAFF-01 · Ver partidos asignados
- **Actor:** Árbitro, Fotógrafo, Oficial de mesa
- **Ruta:** `/mis-partidos`
- **Contenido:**
  - Tabs: "Próximos" / "Realizados".
  - Cada partido: equipos, fecha, cancha, categoría/torneo.
  - Badge del rol del staff en ese partido (Árbitro / Fotógrafo / Oficial).
- **Datos:** `GET /matches?assignedStaff=me`.

### UC-STAFF-02 · Cargar estadísticas (Oficial de mesa)
- **Actor:** Oficial de mesa
- **Ruta:** `/mis-partidos/[matchId]/estadisticas`
- **Contenido:**
  - Formulario de carga de stats por jugador (pts, rebotes, asistencias, robos, faltas, FGA, FGM, 3PA, 3PM).
  - Vista en dos columnas (equipo local / visitante).
  - Guardar como borrador vs. confirmar definitivo.
- **Validaciones:** sólo disponible para partidos donde el staff es el oficial asignado.
- **Datos:** `POST /matches/:id/stats`, `PATCH /matches/:id/stats`.

---

## 6. Panel de administración

### UC-ADMIN-00 · Dashboard
- **Ruta:** `/admin`
- **Contenido:**
  - Cards de estadísticas: total usuarios, equipos activos, torneos en curso, inscripciones pendientes.
  - Accesos rápidos a las secciones principales.
  - Lista de las últimas inscripciones (pendientes de aprobación).
- **Datos:** `GET /admin/stats`.

### UC-ADMIN-01 · Gestión de torneos
- **Ruta:** `/admin/torneos`
- **CRUD:**
  - Crear torneo: nombre, disciplina, descripción, imagen/banner, fecha inicio inscripciones, fecha fin inscripciones, fecha inicio torneo, estado (borrador / visible / cerrado).
  - Editar torneo.
  - Archivar/eliminar torneo.
  - Ver inscripciones.
- **Dato:** `GET/POST/PATCH/DELETE /tournaments`.

### UC-ADMIN-02 · Gestión de categorías y zonas
- **Ruta:** `/admin/torneos/[id]/categorias`
- **Contenido:**
  - Listado de categorías del torneo.
  - Crear/editar categoría: nombre, requisito de edad (desde/hasta), cupo máximo de equipos por zona.
  - Por cada categoría: gestionar zonas (nombre, equipos asignados).
  - Asignar equipos a zonas (drag and drop o selector).
- **Datos:** `GET/POST/PATCH /tournaments/:id/categories`, `GET/POST/PATCH /categories/:id/zones`.

### UC-ADMIN-03 · Inscripciones
- **Ruta:** `/admin/inscripciones` y `/admin/torneos/[id]/inscripciones`
- **Contenido:**
  - Tabla de inscripciones con filtros por torneo, categoría, estado.
  - Acciones: Aprobar / Rechazar (con campo de razón en el rechazo).
  - Ver detalle: equipo, jugadores, categoría solicitada.
- **Datos:** `GET /registrations?status=pending`, `PATCH /registrations/:id` con `{ status: 'approved' | 'rejected', rejectionReason? }`.

### UC-ADMIN-04 · Gestión de equipos
- **Ruta:** `/admin/equipos`
- **Contenido:**
  - Lista de equipos con búsqueda, filtro por disciplina.
  - CRUD de equipos (crear, editar, eliminar).
  - Ver roster con posibilidad de agregar/remover jugadores.
  - Asignar capitán.
  - Ver franquicia asociada.
- **Datos:** `GET/POST/PATCH/DELETE /teams`.

### UC-ADMIN-05 · Gestión de jugadores
- **Ruta:** `/admin/jugadores`
- **Contenido:**
  - Tabla paginada de jugadores con búsqueda por nombre/DNI.
  - Filtro por equipo, estado en lista negra.
  - Ver perfil de jugador: datos, equipos, historial de partidos.
  - Editar datos (incluyendo corrección de DNI con registro de auditoría).
  - Agregar a lista negra.
- **Datos:** `GET /users?role=player`, `PATCH /users/:id`.

### UC-ADMIN-06 · Lista negra
- **Ruta:** `/admin/jugadores/lista-negra`
- **Contenido:**
  - Tabla de jugadores suspendidos: nombre, DNI, razón, fecha de inicio, fecha de fin (si aplica), estado (activo/vencido).
  - Crear nueva entrada.
  - Levantar suspensión.
- **Datos:** `GET/POST/PATCH /blacklist`.

### UC-ADMIN-07 · Gestión de partidos
- **Ruta:** `/admin/partidos`
- **Contenido:**
  - Calendario y lista de partidos.
  - Crear partido: equipos, fecha, cancha, categoría/zona.
  - Asignar staff (árbitro principal, auxiliar, fotógrafo, oficial).
  - Cargar resultado (score final).
  - Ver/editar estadísticas.
  - Estado: programado / en curso / finalizado / suspendido.
- **Datos:** `GET/POST/PATCH /matches`.
- > **Nota:** Esta sección está pendiente de implementar.

### UC-ADMIN-08 · Gestión de staff/empleados
- **Ruta:** `/admin/empleados`
- **Contenido:**
  - Tabs por tipo: Árbitros / Fotógrafos / Oficiales de mesa.
  - CRUD de empleados con datos básicos + rol asignado.
  - Ver historial de partidos cubiertos.
- **Datos:** `GET /users?role=referee,photographer,official`, `PATCH /users/:id`.

### UC-ADMIN-09 · Gestión de canchas/venues
- **Ruta:** `/admin/canchas`
- **Contenido:**
  - CRUD de canchas: nombre, dirección, capacidad, link Google Maps.
  - Vista de calendario de disponibilidad (fase 2).
- **Datos:** `GET/POST/PATCH/DELETE /venues`.

### UC-ADMIN-10 · Gestión de disciplinas
- **Ruta:** `/admin/disciplinas`
- **Contenido:**
  - CRUD de disciplinas: nombre, código (ej: `bskt`, `ftsl`), descripción.
- **Datos:** `GET/POST/PATCH/DELETE /sports`.

### UC-ADMIN-11 · Gestión de usuarios
- **Ruta:** `/admin/usuarios`
- **Contenido:**
  - Tabla paginada con todos los usuarios.
  - Búsqueda por nombre/email/DNI.
  - Filtro por rol.
  - Cambiar rol de usuario.
  - Ver/editar datos de perfil.
  - Eliminar cuenta.
- **Datos:** `GET /users`, `PATCH /users/:id`.

### UC-ADMIN-12 · Configuración del sitio
- **Ruta:** `/admin/configuracion`
- **Contenido:**
  - Información general del sitio (nombre, logo, colores).
  - Configuración de métodos de pago habilitados.
  - Configuración de notificaciones automáticas.
  - Feature flags (habilitar/deshabilitar franquicias, inscripciones, etc.).
- **Datos:** `GET/PATCH /config`.

---

## 6b. Flujo de inscripción — detalle extendido

### UC-PUB-05b · Modal de selección de jugadores al inscribirse
- **Actor:** Delegado (capitán o creador del equipo)
- **Trigger:** Click en botón "Inscribirse" en la página de categoría
- **Flujo:**
  1. Se abre un modal (no redirige).
  2. El modal muestra la lista de jugadores activos del equipo con checkbox.
  3. El delegado selecciona los jugadores que participarán en **este torneo** (no necesariamente todos).
  4. Valida mínimo de jugadores (configurable, ej: 5).
  5. Confirma → POST con `{ teamId, categoryId, playerIds: [...] }`.
  6. Toast de éxito → la página muestra el estado pendiente.
- **Validaciones UX:**
  - Jugadores con suspensión activa se muestran con badge rojo "Suspendido" y no pueden seleccionarse.
  - Jugadores sin DNI verificado se muestran con badge amarillo "Sin verificar".
  - Si el delegado no tiene DNI verificado → bloquear inscripción con mensaje.
- **Datos:** `GET /teams/:id` (miembros), `POST /registrations` con `playerIds[]`.

### UC-REG-VIEW-01 · Vista de inscripción pendiente (período abierto)
- **Actor:** Delegado autenticado con inscripción ya realizada
- **Ruta:** `/torneos/[tournamentSlug]/[categorySlug]` (misma página, estado diferente)
- **Contenido cuando `myRegistration.status === 'pending'` Y inscripciones abiertas:**
  - Header: "Tu inscripción está en revisión"
  - Card del equipo: logo, nombre, disciplina
  - Grilla de jugadores inscriptos en ese torneo: foto o placeholder, nombre (sin stats)
  - Sección de pago:
    - Monto de inscripción del torneo (configurado por torneo)
    - Monto de seguro por jugador × cantidad de jugadores seleccionados
    - **Total a abonar**
    - Método de pago (configurable por torneo):
      - **Efectivo en sede:** muestra lista de sedes habilitadas (nombre + dirección)
      - **Transferencia bancaria:** muestra el alias + CBU del organizador + componente para subir comprobante (drag & drop o file picker)
  - Una vez subido el comprobante: badge "Comprobante enviado, en revisión"
- **Datos:** `GET /registrations/:id` con `players[]`, `GET /tournaments/:id/payment-config`.

### UC-REG-VIEW-02 · Vista cuando el torneo ya comenzó (inscripciones cerradas)
- **Actor:** Cualquier visitante
- **Contenido:** Lista de equipos por zona con sus planteles inscriptos y estadísticas (fase actual, existente).

---

## 6c. Banner de verificación de DNI

### UC-PROFILE-DNI-BANNER · Banner de cuenta sin verificar
- **Actor:** Usuario autenticado sin `documentNumber` validado
- **Dónde aparece:** Banner sticky en la parte superior de **todas las páginas públicas** cuando el usuario está logueado sin DNI.
- **Contenido:** "⚠ Todavía no verificaste tu cuenta. Verificá tu DNI para poder asociarte a equipos."
- **Comportamiento:** No bloquea ni redirige. El usuario puede cerrarlo (se guarda en sessionStorage para no repetirse en la misma sesión). Al hacer click en el texto lleva a `/profile`.
- **No se muestra:** En páginas de `/admin`, `/auth`, y cuando el usuario ya tiene DNI verificado.

---

## 6d. Panel de deudas y suspensiones del delegado

### UC-DELEGATE-01 · Balance del equipo
- **Actor:** Delegado (capitán o creador del equipo)
- **Ruta:** `/equipos/[id]/balance`
- **Acceso:** Link "Balance" visible sólo para delegados en `/profile/equipos` y en el perfil del equipo.
- **Contenido:**
  - **Resumen financiero:**
    - Card: Monto total adeudado (inscripciones + seguros sin pagar)
    - Card: Monto abonado
    - Card: Monto pendiente de confirmación (comprobante enviado, no confirmado)
  - **Detalle de inscripciones:**
    - Tabla: Torneo · Categoría · Estado de pago · Monto · Acción (subir comprobante si aplica)
  - **Jugadores suspendidos:**
    - Tabla: Jugador · Razón · Partidos suspendido · Partidos restantes · Fecha de fin
    - Badge de color: rojo (activo) / gris (cumplido)
  - **Historial de pagos** (futuro, placeholder con "Próximamente")
- **Datos:** `GET /teams/:id/balance`, `GET /blacklist?teamId=:id`.
- **Permisos:** Si el usuario no es capitán/creador ni admin → 404.

---

## 6e. Gestión de jugadores en perfil de equipo

### UC-PROFILE-03b · Agregar/Quitar jugadores (funcional)
- **Actor:** Delegado (capitán o creador) o Admin
- **Dónde:** Página de perfil de equipo `/equipos/[id]`
- **Agregar jugador:**
  - Dialog con campo de búsqueda por nombre o DNI.
  - Muestra resultados de usuarios de la plataforma.
  - Click en "Agregar" → POST `/teams/:id/players`.
  - Toast de éxito + refresh de lista.
- **Quitar jugador:**
  - Botón de basura al lado de cada jugador (ya visible, hacerlo funcional).
  - ConfirmDialog: "¿Estás seguro de que querés quitar a [nombre]?"
  - DELETE `/teams/:id/players/:profileId`.
  - Toast de éxito + refresh.
- **Restricciones:** No se puede quitar al creador del equipo. El creador no puede quitarse a sí mismo.

---

## 6f. Configuración del equipo con control de acceso

### UC-TEAM-SETTINGS · Página de configuración de equipo
- **Ruta:** `/equipos/[id]/gestionar`
- **Acceso:** Sólo capitán, creador o admin. Cualquier otro → `notFound()` (404).
- **Contenido:**
  - Editar nombre, logo, disciplina del equipo.
  - Asignar/cambiar capitán (selector entre los miembros activos).
  - Sección de peligro: Eliminar equipo (con ConfirmDialog).
- **Datos:** `PATCH /teams/:id`, `PATCH /teams/:id/captain/:playerId`, `DELETE /teams/:id`.

---

## 7. Franquicias (extensión)

### UC-FRANCH-01 · Gestionar franquicia
- **Ruta:** `/franquicias/[id]/gestionar`
- **Actor:** Dueño de la franquicia
- **Contenido:**
  - Editar nombre y logo de la franquicia.
  - Lista de equipos de la franquicia con acceso a cada uno.
  - Agregar nuevo equipo a la franquicia (wizard reducido: nombre, disciplina, logo).
  - Ver miembros de todos los equipos de la franquicia.
- **Datos:** `PATCH /franchises/:id`, `POST /teams` con `franchiseId`.

---

## 8. Estados de UI requeridos (todos los casos)

Toda sección que cargue datos del backend debe implementar los siguientes estados:

| Estado | Comportamiento |
|--------|----------------|
| **Loading** | Skeleton del componente (no spinner genérico en página entera). |
| **Error** | Card con mensaje descriptivo + botón "Reintentar". |
| **Vacío** | Ilustración/ícono + texto contextual + CTA cuando aplica. |
| **Sin permisos** | Redirect a `/` con toast "No tenés acceso a esta sección". |

---

## 9. Contrato de datos esperado (resumen)

```
GET  /tournaments                  → PaginatedResponse<Tournament>
GET  /tournaments/:slug            → Tournament con categories[]
GET  /teams/:id                    → Team con members[], registrations[], matches[]
GET  /matches/:id                  → Match con stats[], homeTeam, awayTeam, staff[]
GET  /registrations?profileId=me   → Registration[] con team, category, tournament
GET  /profiles/me                  → Profile con blacklistStatus
GET  /franchises/mine              → Franchise[] con teams[]
GET  /matches?assignedStaff=me     → Match[] para staff
POST /registrations                → Registration creada
POST /franchises                   → Franchise creada
PATCH /profiles/me                 → Profile actualizado
PATCH /registrations/:id           → Registration aprobada/rechazada
POST /matches/:id/stats            → Stats guardadas
```

---

## 10. Pendientes prioritarios (ordenados)

### Sprint actual (implementando)
1. ✅ **Banner DNI** (UC-PROFILE-DNI-BANNER) — banner no bloqueante para usuarios sin DNI.
2. ✅ **Balance del delegado** (UC-DELEGATE-01) — `/equipos/[id]/balance` con deudas y suspensiones.
3. ✅ **Agregar/Quitar jugadores** (UC-PROFILE-03b) — botones funcionales en perfil de equipo.
4. ✅ **Settings de equipo con 404** (UC-TEAM-SETTINGS) — `/equipos/[id]/gestionar` con control de acceso.
5. ✅ **Modal selección de jugadores** (UC-PUB-05b) — al inscribirse, elegir jugadores del equipo.
6. ✅ **Vista de inscripción pendiente con pagos** (UC-REG-VIEW-01) — estado durante inscripciones abiertas.
7. ✅ **Mock JSON** — migrar todos los mocks inline a `apps/web/mock/*.json`.

### Siguiente sprint
8. **Gestión de partidos** (UC-ADMIN-07) — sin implementar.
9. **Carga de stats por oficial** (UC-STAFF-02) — sin implementar.
10. **Detalle de partido con datos reales** — actualmente usa mock.
11. **Mis torneos** (UC-PROFILE-04) — página vacía.
12. **Perfil público de equipo con datos reales** — usa mocks de stats.
13. **Gestión de franquicia** (UC-FRANCH-01) — sin implementar.
14. **Landing con torneos reales** (UC-PUB-01) — usa datos hardcodeados.
