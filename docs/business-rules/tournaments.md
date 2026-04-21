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

## RN-047 — Formato de playoffs (BO1 / BO3 / BO7) configurable y editable

- **Contexto**: Llaves de playoffs.
- **Regla**: Los playoffs se configuran por **categoría** como **BO1**, **BO3**, **BO7**, etc. La organización lo define al crear la categoría y puede **editarlo hasta que la etapa de playoffs comience**. Una vez comenzada esa etapa, el formato queda congelado.
- **Notas**: Se puede ajustar según la cantidad de equipos finalmente clasificados.

## RN-058 — [A DEFINIR] Ascensos y descensos entre categorías

- **Contexto**: Movilidad de equipos entre categorías al cerrar un torneo.
- **Regla (parcial)**: El equipo **campeón** de una categoría **asciende** a la categoría superior. El equipo **último** de una categoría **desciende**.
- **Pendiente**: Definir si el descenso es **directo** o si juega un **repechaje** (por ejemplo, contra el 2° de la categoría inmediatamente inferior) para decidir la plaza.
- **Premios**: Los premios de cada torneo se definen en los **Términos y Condiciones del torneo** y son **configurables por torneo**.
