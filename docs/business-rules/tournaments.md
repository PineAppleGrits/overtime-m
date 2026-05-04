# Reglas de Negocio — Torneos

## RN-043 — Modalidad del torneo (3v3 o 5v5)

- **Contexto**: Configuración del torneo.
- **Regla**: Cada torneo define su modalidad: **3v3** o **5v5**.
- **Notas**: Por ahora el único deporte soportado es **básquet**. Otras disciplinas quedan fuera del alcance actual.

## RN-044 — Categorías del torneo y asignación habilitada por equipo

- **Contexto**: Relación entre torneo, categorías y equipos.
- **Regla**: Un torneo puede tener **N categorías**. Un equipo puede postularse **sólo a las categorías para las que fue categorizado** por la organización (ver [RN-039](./teams.md#rn-039--categorización-previa-del-equipo-por-la-organización)). Un equipo puede estar habilitado en hasta 2 categorías del torneo, pero sólo puede inscribirse en 1 (ver [RN-040](./enrollments.md#rn-040--equipo-en-1-categoría-por-torneo)).

## RN-045 — Formato del torneo

- **Contexto**: Estructura de disputa del torneo.
- **Regla**: El torneo admite formato de **ida**, **ida y vuelta**, o **playoffs**. En playoffs la llave cruza con la otra zona cuando existe; si no, los playoffs se resuelven dentro de la misma zona.
- **Configuración**: Por **categoría** se debe poder configurar cuántos equipos clasifican a playoffs.

## RN-046 — Fechas del torneo

- **Contexto**: Vigencia del torneo.
- **Regla**: El torneo declara **fecha de comienzo** (día exacto) y **mes de fin** (sin día exacto).

## RN-047 — Formato de playoffs (BO1 / BO3 / BO5) configurable y editable

- **Contexto**: Llaves de playoffs.
- **Regla**: Los playoffs se configuran por **categoría** y **por ronda** como **BO1**, **BO3** o **BO5**. La organización define el formato de cada ronda al crear/editar la categoría y puede **editarlo hasta que la etapa de playoffs comience**. Una vez comenzada esa etapa, el formato queda congelado.
- **Ejemplo**: cuartos BO3, semis BO3, final BO5, tercer puesto BO1.
- **Notas**:
  - "Ida y vuelta agregado" (estilo Champions League) **no se soporta** — el BO format cubre toda la mecánica de playoffs (DP-004).
  - `Tournament.fixtureFormat = DOUBLE_ROUND` aplica **solo a la fase regular**.
  - Se puede ajustar la cantidad de rondas según cuántos equipos finalmente clasifiquen (ver RN-045).

## RN-058 — Ascensos, descensos y repechaje entre categorías

- **Contexto**: Movilidad de equipos entre categorías al cerrar un torneo.
- **Regla**:
  - El equipo **campeón** de una categoría **asciende** a la categoría inmediatamente superior (si existe).
  - El equipo **último** de una categoría **desciende** a la categoría inmediatamente inferior (si existe), pero **no en forma directa**: juega un **repechaje** contra el **2°** de esa categoría inferior. El **ganador del repechaje** ocupa la plaza en la categoría superior.
  - Si **no existe categoría superior** (estamos en el nivel más alto): el campeón se mantiene en la misma categoría.
  - Si **no existe categoría inferior** (estamos en el nivel más bajo): el último se mantiene en la misma categoría.
- **Ejemplo**: Categorías A → B → C.
  - Campeón de C asciende a B.
  - Último de B juega repechaje contra 2° de C. El ganador queda en B.
  - Campeón de B asciende a A.
  - Último de A juega repechaje contra 2° de B. El ganador queda en A.
- **Niveles del equipo (RN-044)**: el cambio de categoría tras la temporada **modifica el nivel global del equipo** (ver `CategoryLevel`). El admin/master puede sobreescribir ajustes manuales si la organización lo decide.
- **Premios**: Los premios de cada torneo se definen en los **Términos y Condiciones del torneo** y son **configurables por torneo**.
- **Pendiente**: formato del repechaje (BO1/BO3/BO5) y momento de ejecución (al cerrar torneo automáticamente vs acción explícita del admin) — ver DP-005.
