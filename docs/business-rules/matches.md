# Reglas de Negocio — Partidos y Tabla

## RN-024 — Marcador 0-0 no suma puntos

- **Contexto**: Puntaje del torneo.
- **Regla**: En básquet, un partido **no puede finalizar 0-0 orgánicamente**. El 0-0 sólo aparece como marcador administrativo en el caso de **cancelación mutua** (ver [RN-056](#rn-056--cancelación-mutua-0-0-como-partido-jugado-sin-ganador)). En ese caso el partido **se registra como disputado** pero **no suma puntos** para ninguno de los dos equipos (no hay ganador ni perdedor en tabla).
- **Notas**: El resultado queda registrado en el histórico para trazabilidad.

## RN-049 — Staff mínimo requerido para habilitar el partido

- **Contexto**: Habilitación de un partido para que pueda disputarse.
- **Regla**: Un partido sólo puede jugarse si tiene confirmado, como mínimo, **1 árbitro** y **1 oficial de mesa**. La configuración ideal es **2 árbitros + 2 oficiales de mesa**.
- **Incumplimiento**: Si el día del partido no se alcanza el staff mínimo, el partido **se reprograma**. La causa se imputa a la **organización**, por lo que no hay multa ni pérdida de puntos para los equipos.
- **Notas**: Caso poco frecuente — dejado como contingencia estándar.

## RN-050 — Asignación de árbitros y staff desde el backoffice

- **Contexto**: Asignación de staff (árbitros, oficiales de mesa, multimedia) a partidos.
- **Regla**: Por ahora los **admin asignan directamente** al staff de un partido desde el backoffice. No hay flujo self-service para el staff.
- **Evolución**: A futuro habrá **coordinadores por rol** (árbitros, oficiales, multimedia) con potestad de asignar dentro de su disciplina sin pasar por admin.
- **Notas**: La evolución a coordinadores modifica quién ejecuta la asignación, no el hecho de que pase exclusivamente por el backoffice.

## RN-051 — Empleados multimedia: cobertura del partido y carpeta Drive

- **Contexto**: Staff multimedia (fotógrafos) y cobertura del partido.
- **Regla**: El multimedia asignado a un partido carga las fotos en la **carpeta de Google Drive** del partido. La carpeta se **crea al comenzar el partido**; el link queda disponible para el multimedia y para los equipos cuando corresponda.
- **Permisos del Drive**: Una vez creada la carpeta, los **permisos a nivel Google Drive no se gestionan desde la plataforma** — quedan a cargo del manejo externo del Drive.
- **Relación**: La asignación del multimedia al partido sigue [RN-050](#rn-050--asignación-de-árbitros-y-staff-desde-el-backoffice).

## RN-052 — Reprogramación sin penalización por aviso con mucha antelación

- **Contexto**: Equipo que avisa con antelación significativa que no puede disputar un partido.
- **Regla**: Si un equipo avisa con **mucha antelación**, el partido se **reprograma sin penalización** alguna. El umbral de "mucha antelación" es **discrecional del admin** y debe estar **publicado en los Términos y Condiciones del torneo**.
- **Relación**: [RN-032](./fines.md#rn-032--cancelación-en-tiempo-elección-del-equipo-rival) cubre la ventana de 72 hs; [RN-025](./fines.md#rn-025--multa-por-cancelación-tardía--no-presentarse) cubre el caso fuera de plazo.

## RN-053 — Deuda pendiente bloquea el siguiente partido

- **Contexto**: Equipo con deudas impagas antes de su próximo encuentro.
- **Regla**: Un equipo que no haya **saldado sus deudas antes del siguiente partido** no queda habilitado para disputarlo.
- **Excepción a definir**: [RN-026](./fines.md#rn-026--a-definir-pago-parcial-del-50-para-habilitar-siguiente-partido) propone que abonando el 50% de la multa el equipo quede habilitado. Esa excepción está **pendiente de decisión** — por defecto prevalece la regla general de esta RN.

## RN-054 — Partido suspendido durante el encuentro

- **Contexto**: El partido, una vez comenzado, debe interrumpirse.
- **Causas típicas**:
  1. **Problemas de cancha**: aro, reloj, luz u otra infraestructura.
  2. **Suspensión disciplinaria en acto**: expulsión o conducta indebida grave que obliga a cortar el partido.
- **Resoluciones posibles** (a criterio del árbitro / organización según el caso):
  - **Reanudación** — el partido se completa en otra fecha.
  - **Fin sin continuidad con ganador asignado** — el encuentro no se reanuda. Si la suspensión fue **provocada por el equipo que iba ganando** (ej: 50-40, el equipo que va 50 le pega al otro y el árbitro decide suspender sin continuidad), se le da el partido por **ganado al equipo que iba perdiendo**. El **marcador final** queda igual al del momento de la suspensión (en el ejemplo: 50-40), explicitando en la planilla el **ganador real** y la **causa**.
- **Notas**: El criterio de "fin sin continuidad" puede variar según disciplina.

## RN-055 — Partido suspendido sin reprogramación

- **Contexto**: Partido suspendido que, a criterio de la organización, no se reprograma.
- **Regla**: La **resolución** (ganador del partido, validez del marcador, suspensiones disciplinarias aplicadas a jugadores o equipos) queda a **decisión del juez y de la organización**. No hay un algoritmo fijo — se resuelve caso por caso con justificación en el acta/planilla.
- **Relación**: Ver [RN-054](#rn-054--partido-suspendido-durante-el-encuentro) para el detalle de cómo puede aplicarse una "fin sin continuidad" dentro de un encuentro ya iniciado.

## RN-056 — Cancelación mutua: 0-0 como partido jugado sin ganador

- **Contexto**: Ambos equipos cancelan el mismo partido (ej: los dos con deudas impagas).
- **Regla**: El partido se **registra como jugado** con resultado **0-0**. Ningún equipo gana ni pierde: **no suma puntos** para ninguno (coherente con [RN-024](#rn-024--marcador-0-0-no-suma-puntos) — en básquet un 0-0 es sólo un marcador administrativo).
- **Uso**: Deja constancia de que la fecha se consumió sin necesidad de reprogramar.
