# Reglas de Negocio — Jugadores

## RN-003 — Suspensión de jugadores

- **Contexto**: Disciplina.
- **Regla**: Un jugador puede estar suspendido por X cantidad de partidos.
- **Notas**: Referencia ticket `OVRT-27`. Ver [RN-030](./fines.md#rn-030--ajc-habilitación-anticipada-por-pago) (AJC — habilitación anticipada mediante pago).

## RN-006 — Sin tope global de equipos por usuario

- **Contexto**: Membresía de un usuario en equipos.
- **Regla**: Un usuario puede pertenecer como jugador a **todos los equipos que quiera**. No hay tope global de membresía.
- **Motivo**: La restricción relevante es la de participación **por torneo**, no la de pertenencia total.
- **Relación**: El único límite efectivo está a nivel torneo — ver [RN-038](#rn-038--máximo-de-equipos-por-torneo) (máximo 2 equipos por torneo, en categorías distintas).

## RN-007 — No duplicar equipo en la misma categoría

- **Contexto**: Participación de usuarios en torneos.
- **Regla**: Un usuario no puede jugar en dos equipos distintos dentro de la misma categoría.
- **Relación**: Ver [RN-038](#rn-038--máximo-de-equipos-por-torneo) (extiende el límite al nivel de torneo) y [RN-041](./enrollments.md#rn-041--resolución-de-conflicto-multi-equipo-por-seña) (resolución de conflicto cuando se rompe esta restricción).

## RN-008 — Apto médico y declaración jurada anuales

- **Contexto**: Habilitación de jugadores.
- **Regla**: Cada jugador debe subir a la plataforma su apto médico y declaración jurada (descarga del formulario, firma digital y upload). Vigencia: **año calendario** — cubre únicamente los torneos de ese año. Para el año siguiente, el jugador debe subir documentación nueva.
- **Ejemplo**: Apto subido en 2026 cubre todo 2026. En 2027 el jugador debe subir nuevamente.
- **Auditoría**: La plataforma conserva el **registro histórico de cada archivo subido** (año, fecha de subida, usuario que subió). No se sobrescribe — cada nueva carga queda como una nueva versión archivada.
- **Motivo**: Requisito obligatorio para poder jugar; histórico disponible para consultas disciplinarias y legales.

## RN-037 — Estado activo / inactivo del jugador

- **Contexto**: Ciclo de vida del rol Jugador.
- **Regla**: Todo usuario tiene implícitamente rol **Jugador**. Se considera:
  - **Jugador inactivo** cuando no pertenece a ningún equipo.
  - **Jugador activo** cuando pertenece a **≥ 1 equipo**.
- **Motivo**: Diferenciar usuarios que solo exploran/gestionan vs. los que efectivamente compiten.

## RN-038 — Máximo de equipos por torneo

- **Contexto**: Participación de un jugador dentro de un mismo torneo.
- **Regla**: Por torneo, un jugador puede participar como máximo en **2 equipos**, y esos 2 equipos deben pertenecer a **categorías distintas**. Nunca puede estar en 2 equipos de la misma categoría (ver [RN-007](#rn-007--no-duplicar-equipo-en-la-misma-categoría)).
- **Relación**: La resolución de conflictos cuando un jugador aparece anotado en más equipos de los permitidos se rige por [RN-041](./enrollments.md#rn-041--resolución-de-conflicto-multi-equipo-por-seña).
