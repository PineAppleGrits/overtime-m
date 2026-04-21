# Reglas de Negocio — Multas y Aranceles

## RN-025 — Multa por cancelación tardía / no presentarse

- **Contexto**: Incumplimiento de partido **sin aviso en tiempo**.
- **Regla**: Si un equipo **no avisa dentro del plazo estipulado** (cancelación tardía) o directamente no se presenta al encuentro:
  - **Pierde el partido** automáticamente.
  - La multa equivale al costo de una **jornada completa**, entendida como el **valor de ambos equipos** (no de uno solo).
- **Relación**:
  - Ver [RN-027](#rn-027--multa-por-modificación--ausencia-post-fecha-disponible) para el caso post fecha disponible con monto × 2.
  - Ver [RN-032](#rn-032--cancelación-en-tiempo-elección-del-equipo-rival) para el caso de cancelación **en tiempo** (dentro de las 72 hs de la misma semana), donde la decisión queda en manos del equipo rival.
  - Ver [RN-052](./matches.md#rn-052--reprogramación-sin-penalización-por-aviso-con-mucha-antelación) para aviso con mucha antelación, sin penalización.

## RN-026 — [A DEFINIR] Pago parcial del 50% para habilitar siguiente partido

- **Contexto**: Deuda por multa de RN-025.
- **Regla propuesta**: El equipo podría abonar el **50% de la multa** para quedar habilitado a jugar el **siguiente partido**. La deuda restante seguiría vigente; el saldo aplica [RN-028](#rn-028--interés-por-deuda-vencida) si vence.
- **Estado**: **Pendiente de decisión.** Por defecto aplica [RN-053](./matches.md#rn-053--deuda-pendiente-bloquea-el-siguiente-partido) (cualquier deuda bloquea), salvo que se decida mantener esta excepción. Pendiente definir también a qué tipos de deuda aplicaría (solo multas, todas).

## RN-027 — Multa por modificación / ausencia post fecha disponible

- **Contexto**: Modificar o no presentarse a un encuentro luego de la fecha-límite disponible.
- **Regla**: La multa equivale a **la jornada completa × 2** (monto efectivo).

## RN-028 — Interés por deuda vencida

- **Contexto**: Deuda impaga posterior al vencimiento.
- **Regla**: Por cada día vencido mientras la deuda no se cancele, se **emite un cargo independiente** con:
  - Monto según el valor vigente en la plataforma **al momento de emitirse** (configurable — ver RN-021).
  - **Descripción** que identifica el concepto (ej: "Interés por día vencido — deuda #N — fecha YYYY-MM-DD").
- **Motivo**: Cada cargo queda **agnóstico a futuros cambios del fee**; cambiar el valor del interés no recalcula cargos ya emitidos, solo afecta los siguientes.
- **Notas**: Valor inicial referencial: $5.000/día. Confirmar si aplica solo a multas (RN-025/RN-027) o también a otros conceptos vencidos.

## RN-029 — Arancel por pago fuera de fecha

- **Contexto**: Pago de inscripción/cuotas luego del vencimiento.
- **Regla**: El límite de pago en fecha es el **lunes posterior al fin de semana** de juego. Pasado ese plazo, se suma **X por día** de atraso.
- **Notas**: Definir valor de X.

## RN-030 — AJC (habilitación anticipada por pago)

- **Contexto**: Jugadores suspendidos por disciplina, cuando ya transcurrió parte de la suspensión.
- **Regla**: Pasada una cantidad X de fechas cumplidas, el tribunal puede autorizar al jugador a pagar un **AJC** para habilitarse anticipadamente por una cantidad específica de partidos.
- **Fórmula**: `AJC = sueldo del árbitro por partido × cantidad de fechas a liberar`.
- **Ejemplo**: Jugador suspendido 14 fechas. Luego de 7 cumplidas, el tribunal autoriza AJC. Paga 2 × sueldo árbitro y queda habilitado por 2 partidos; las 5 fechas restantes siguen pendientes tras ese intervalo.
- **Notas**: Confirmar X (fechas mínimas para habilitar AJC) y si requiere autorización caso por caso.

## RN-031 — Estados y gestión de deudas

- **Contexto**: Administración de deudas.
- **Regla**: Las deudas pueden tener los siguientes estados:
  - **Aprobada** — vigente, exigible.
  - **Eliminada por error** — no se registra.
  - **Eliminada con registro** — se cancela pero queda trazabilidad.
- **Notas**: Solo admin puede cambiar estados; todas las acciones se auditan.

## RN-032 — Cancelación en tiempo: elección del equipo rival

- **Contexto**: Un equipo avisa que no puede disputar el partido **con al menos 72 hs de anticipación** (en la misma semana del encuentro, dentro del plazo admitido).
- **Regla**: La cancelación en tiempo **no genera multa automática** para el equipo que cancela. El **equipo rival** decide entre dos opciones:
  1. **Pedir los puntos** — el resultado se asigna como **20-0** por no-presentación.
  2. **Reprogramar** el encuentro.
- **Relación**:
  - [RN-052](./matches.md#rn-052--reprogramación-sin-penalización-por-aviso-con-mucha-antelación) — con mucha más antelación, la reprogramación es directa y sin decisión del rival.
  - [RN-025](#rn-025--multa-por-cancelación-tardía--no-presentarse) — si se avisa fuera del plazo de 72 hs, ya hay multa y pérdida del partido.
- **Notas**: Definir el mecanismo exacto de decisión del rival (plazo para elegir, default si no responde) y cómo se registra en la tabla si elige "pedir los puntos".
