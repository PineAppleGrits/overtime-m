# Definiciones Pendientes

Decisiones de producto/negocio que quedan abiertas y bloquean (o condicionan) la implementación. Cada ítem tiene contexto, las opciones evaluadas y el estado.

Cuando se cierre una decisión, mover el contenido a la business rule correspondiente (`docs/business-rules/`) o al doc de la feature, y eliminar de este archivo.

---

## DP-001 — Default de formato de playoffs por modalidad

**Contexto**: RN-047 establece que los playoffs por categoría son configurables como BO1/BO3/BO7 al crear la categoría. Sin embargo, al crear una categoría conviene tener un **default sensato** según la modalidad del torneo, para no obligar al admin a elegir cada vez.

**Opciones bajo evaluación**:
- 3v3 — BO1 (partidos cortos, secuencia rápida).
- 5v5 — BO3 en cuartos/semis, BO7 en final, o BO3 transversal.

**Pendiente**:
- Confirmar default para 3v3.
- Confirmar default para 5v5 (uniforme o por ronda).
- Definir si el default de "BO en final" puede diferir del default de "BO en rondas previas".

**Estado**: a definir.
**Relación**: RN-047 (formato configurable y editable hasta inicio de playoffs).

---

## DP-002 — Tope máximo de roster en lista de buena fe (5v5)

**Contexto**: RN-009 menciona referencia a 25 jugadores como tope de lista de buena fe en 5v5, pero deja la confirmación pendiente.

**Pendiente**: Confirmar valor exacto. ¿25 está bien? ¿Cambia por modalidad además de 3v3 (max 6)?

**Estado**: a definir. Valor temporal en código: **25**.
**Relación**: RN-009.

---

## DP-003 — [RESUELTA — 2026-05-03] Cruces inter-zona en playoffs

**Resolución**:
- **Máximo 2 zonas en v1**. 3+ zonas no se soporta hasta nuevo aviso.
- **Cruce NBA estándar** con 2 zonas: 1°A vs N°B, 2°A vs (N-1)°B, etc. Cuadro fijo armado en cuartos (no reseed).
- **1 zona única**: clasifican N equipos de la tabla, cruce 1 vs N, 2 vs N-1, etc.
- **Configuración por `Category`**: cantidad de zonas, total de clasificados y/o clasificados por zona.

A migrar a RN o doc de feature `playoffs` cuando se implemente. Mantener referencia mientras tanto.

---

## DP-004 — [RESUELTA — 2026-05-03] Ida y vuelta en playoffs

**Resolución**:
- `Tournament.fixtureFormat` (`SINGLE_ROUND` / `DOUBLE_ROUND`) aplica **solo a la fase regular**.
- Los playoffs usan **BO1 / BO3 / BO5** configurables por categoría y por ronda.
- Se elimina la opción "ida y vuelta agregado" en playoffs.
- **Actualización a RN-047**: el set de formatos válidos pasa a `BO1 | BO3 | BO5` (antes mencionaba BO7 como referencia abierta).

A migrar a RN-047 cuando se implemente la feature.

---

## DP-005 — Detalles operativos del repechaje (RN-058)

**Contexto**: RN-058 quedó cerrada en su mecánica principal:
- Campeón asciende; último de la categoría superior juega repechaje contra el 2° de la inferior; ganador queda en la superior.
- Edge cases definidos para nivel más alto y más bajo.

**Pendiente** (operativo):
- **Formato del repechaje**: ¿BO1, BO3 o BO5? ¿Configurable por torneo, por categoría, o fijo (ej. siempre BO1)?
- **Momento de ejecución**: ¿se dispara automáticamente al cerrar el torneo (cuando todas las categorías terminan playoffs) o requiere acción explícita del admin para programarlo?
- **Calendario**: ¿el repechaje se juega dentro del mismo torneo (extensión de fechas) o como evento aparte entre torneos?
- **Cambio de nivel del equipo**: ¿el `CategoryLevel` del equipo se actualiza automáticamente al confirmar el repechaje o requiere acción manual del admin?

**Estado**: a definir.
**Relación**: RN-058, RN-044.

---

## DP-006 — Pago parcial del 50% para habilitar siguiente partido

**Contexto**: RN-026 propone que abonando el 50% de la multa el equipo quede habilitado para jugar el siguiente partido, pero aclara que está "pendiente de decisión". Por defecto aplica RN-053 (cualquier deuda bloquea).

**Pendiente**:
- ¿Se aprueba la excepción del 50%?
- Si sí, ¿aplica solo a multas (RN-025/RN-027) o también a deudas por aranceles (RN-029) e intereses (RN-028)?

**Estado**: a definir. Default actual: RN-053 estricto.
**Relación**: RN-026, RN-053.

---

## DP-007 — Cantidad de fechas mínimas para AJC

**Contexto**: RN-030 (AJC = habilitación anticipada por pago) requiere que pase una cantidad X de fechas cumplidas antes de habilitarse. X no está definido.

**Pendiente**: Definir X y si requiere autorización caso por caso del tribunal.

**Estado**: a definir.
**Relación**: RN-030.

---

## DP-008 — Cantidad de amistosos para categorizar

**Contexto**: RN-039 establece que un equipo nuevo se categoriza luego de "X partidos amistosos observados", pero X no está definido.

**Pendiente**:
- Definir X (cantidad mínima de amistosos).
- Definir si la categorización se revalida entre temporadas.
- Definir criterios concretos de observación (qué se evalúa).

**Estado**: a definir.
**Relación**: RN-039, RN-059.

---

## DP-009 — Mecanismo exacto de validación de DNI

**Contexto**: RN-036 establece que el DNI se valida con foto, pero el método técnico (OCR, IA, lector físico, manual) queda a definir.

**Pendiente**:
- Elegir mecanismo (manual / IA / mixto).
- Definir umbral de confianza (si IA).
- Flujo ante rechazo.

**Estado**: a definir.
**Relación**: RN-036.

---

## DP-010 — Plazo para decisión del rival ante cancelación en tiempo

**Contexto**: RN-032 da al equipo rival la opción de pedir los puntos (20-0) o reprogramar cuando el otro cancela con 72hs. No define el plazo en que el rival debe decidir ni el default si no responde.

**Pendiente**:
- Plazo del rival para decidir (¿24hs? ¿hasta el día previo?).
- Default si no responde (¿reprograma? ¿se le dan los puntos automáticamente?).

**Estado**: a definir.
**Relación**: RN-032.

---

## DP-011 — Descuento por franquicia

**Contexto**: RN-012 promete un descuento X para franquicias con N equipos inscriptos.

**Pendiente**:
- Valor de N (cantidad de equipos para gatillar).
- Valor de X (porcentaje o monto fijo).
- Si se aplica por equipo o al total de la franquicia.

**Estado**: a definir.
**Relación**: RN-012.

---

## DP-012 — Ventana exacta para crear/promover equipo a franquicia

**Contexto**: RN-010 establece que la creación de equipos y promoción a franquicia solo está habilitada en ventanas de fecha. No define quién las configura ni a qué nivel aplican.

**Pendiente**:
- Quién configura (master / admin).
- Nivel de aplicación (global / por torneo / por categoría).
- Comportamiento si el usuario intenta fuera de la ventana.

**Estado**: a definir.
**Relación**: RN-010.

---

## DP-015 — Formato del nombre de la carpeta de Google Drive por partido

**Contexto**: RN-051 establece que el multimedia carga las fotos del partido en una carpeta de Google Drive que se crea **al comenzar el partido**. El nombre / estructura de la carpeta no está definido.

**Pendiente**:
- Formato del nombre (ej: `{torneo}_{categoria}_{fecha}_{equipoLocal}vs{equipoVisitante}`, o slug-based, o jerárquico con subcarpetas).
- ¿Carpetas anidadas por torneo/categoría/fecha o todas planas?
- ¿Convención de timezone, idioma, mayúsculas?

**Estado**: a definir. El usuario va a pasar el formato deseado.
**Relación**: RN-051.

---

## DP-017 — Seña de amistoso: ¿se resta del costo total del partido?

**Contexto**: RN-022 establece que cada equipo paga una seña para confirmar un amistoso. Una vez jugado el partido, el costo total (cancha, staff, etc.) puede ser superior a las dos señas o exactamente cubierto por ellas.

**Pendiente**:
- ¿La seña es un **anticipo** que se descuenta del costo total a abonar tras el partido?
- ¿O es un **cargo adicional** independiente del costo del partido (pago de "compromiso")?
- Si es anticipo:
  - ¿El descuento es por equipo (mi seña baja mi parte) o agregado (la suma de ambas señas baja el total y luego se reparte)?
  - Si tras descontar la seña el saldo es negativo (overpayment), ¿se devuelve, se acredita, o queda sin acción?
- Si es cargo adicional: ¿el monto es fijo (independiente del partido) o se calcula como % del costo total?

**Estado**: a definir.
**Relación**: RN-022, RN-023.

---

## DP-016 — Guardar número de comprobante como dato estructurado

**Contexto**: RN-060 establece que el comprobante de transferencia se borra del storage 3 días después de aprobado. Como alternativa o complemento, se podría guardar el **número/referencia del comprobante** como campo estructurado en `Payment` para mantener trazabilidad post-borrado.

**Pendiente**:
- ¿Se implementa además del auto-borrado, o como reemplazo?
- ¿El admin lo carga manualmente al aprobar, o lo extrae del archivo (OCR)?
- ¿Es obligatorio o opcional?
- ¿Cómo se valida (formato libre, pattern de número de transferencia bancaria, etc.)?

**Estado**: a definir.
**Relación**: RN-060, RN-014.

---

## DP-014 — Detalle del play-in pre-playoffs

**Contexto**: Al definir playoffs, mencionaste la posibilidad de que haya un **play-in** entre el 8° y el 9° (o equivalente) antes de los cuartos de final. Falta cerrar la mecánica.

**Pendiente**:
- ¿Cuántos equipos participan del play-in (formato NBA: 7°-10° con doble eliminación, o más simple: 8° vs 9° BO1)?
- ¿Qué premia el play-in: 1 plaza o 2 plazas en cuartos?
- ¿Es configurable por categoría (algunas categorías sí, otras no) o se prende globalmente?
- ¿BO format del play-in fijo (BO1) o configurable?

**Estado**: a definir. Por ahora se modela un flag `Category.hasPlayIn: boolean` y un sub-config a definir.
**Relación**: RN-045, RN-047.

---

## DP-013 — Umbral de "mucha antelación" para reprogramación sin penalidad

**Contexto**: RN-052 permite reprogramar sin multa si el equipo avisa con "mucha antelación". El umbral es discrecional y debe estar en los Términos y Condiciones del torneo.

**Pendiente**:
- ¿El umbral se configura por torneo (campo nuevo) o queda solo en T&C en texto libre?
- Si va por torneo: nombre del campo, default en horas/días.

**Estado**: a definir. Recomendación técnica: campo configurable por torneo (`earlyCancellationThresholdHours`).
**Relación**: RN-052.
