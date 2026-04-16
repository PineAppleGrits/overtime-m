# Modelo de Dominio

Entidades principales, estados y relaciones. Complementa [business-rules/](./business-rules/). Este documento describe **qué existe** en el dominio; las reglas que lo gobiernan están en las RN.

## Jerarquía

```
Torneo
  └── Categoría
        └── Zona
              └── Equipos
                    └── Partidos
```

**Ejemplo**:

```
Torneo Apertura 2026
  ├── Categoría A
  │     ├── Zona Roja
  │     └── Zona Azul
  └── Categoría B
        └── ...
```

---

## Entidades

### Torneo

Agrupación de alto nivel (ej: "Torneo Apertura 2026"). Contiene categorías. Define fechas generales, cupos y ventanas de inscripción.

### Categoría

Agrupación por nivel/división dentro de un torneo (ej: Categoría A, B).

- **Máximo de equipos**: se infiere del torneo, no forma parte del schema de la categoría.
- **status** (enum):
  - `OPEN` — inscripciones abiertas.
  - `CLOSED` — cerrada (por fin de fecha de inscripción o por categoría llena; también mientras se preparan zonas).
  - `IN_PROGRESS` — torneo en curso.
  - `FINISHED` — finalizado.
- **substatus** (enum):
  - `REGULAR_FASE` — temporada regular tipo liga (todos contra todos).
  - `PLAYOFFS_FASE` — fase eliminatoria. *Pendiente de definir en detalle.*

### Zona

Subgrupo dentro de una categoría (ej: Zona Roja, Zona Azul).

### Equipo

Conjunto de jugadores inscriptos bajo un delegado. Se inscribe a categorías vía postulación. Ver RN-001, RN-002, RN-004.

- **Delegado**: usuario responsable del equipo. Ver RN-005.
- **Lista de buena fe**: jugadores declarados al crear el equipo. Mínimo 8 (RN-009).

### Franquicia

Agrupación de múltiples equipos bajo un mismo titular. Ver RN-011, RN-012.

### Inscripción (Equipo ↔ Categoría)

Vincula un equipo a una categoría específica de un torneo. Tiene estado propio (ver sección "Estados de postulación/inscripción"). Mantiene el **roster histórico** del equipo en ese torneo (snapshot — RN-004).

### Partido

Enfrentamiento entre dos equipos dentro de una zona/categoría. Referencia ticket `OVRT-23`.

- **Resultado**: empate 0-0 no suma a la tabla (RN-024).

### Amistoso

Encuentro no oficial generado a partir de una solicitud de un equipo.

- **Estado tentativo**: `SOLICITADO` → `PENDIENTE_CONFIRMACION` → `CONFIRMADO` / `CANCELADO`.
- **Seña**: requerida por ambos equipos para confirmar (RN-022).
- **Ventana de confirmación**: 24 hs (RN-023).
- **Rango horario**: ver enum abajo.

### Jugador

Persona que participa en equipos.

- **Campos**: Nombre completo, DNI, Teléfono, Apto médico (archivo + vigencia), Declaración jurada (archivo firmado).
- **Vigencia del apto**: año calendario (RN-008).
- Puede tener registros de bloqueo/suspensión (ver abajo).

### Bloqueo / Suspensión de jugador

Registro que inhabilita (total o parcialmente) a un jugador. Ver RN-003.

**Campos**:
- Nombre completo
- DNI
- Fecha de bloqueo
- Quién lo bloqueó (admin responsable)
- Razón del bloqueo
- Archivos asociados (opcional — a confirmar)

### Deuda / Multa

Saldo pendiente a cargo de un equipo (o jugador). Ver RN-025 a RN-031.

**Campos**:
- Monto original
- Concepto (cancelación, no-presentación, atraso, AJC, etc.)
- Fecha de creación y fecha de vencimiento
- Pagos parciales aplicados
- Estado: `APROBADA` | `ELIMINADA_POR_ERROR` | `ELIMINADA_CON_REGISTRO` (RN-031)
- Equipo/jugador asociado

### Transacción / Pago

Movimiento económico en la plataforma (inscripción, seguro, multa, seña, AJC, etc.).

- **Campos**: monto, concepto, fecha, responsable, referencia a la deuda/inscripción.
- Admin puede crear, editar o eliminar transacciones (F-012).

### Draft

Registro de jugador sin equipo. Formulario con: edad, altura, posición, experiencia (texto libre). Se usa para matchear con equipos que buscan jugadores (F-014).

### Usuario

Persona registrada en la plataforma. Puede tener uno o más roles (ver abajo).

---

## Roles

- **Admin**: aprueba/rechaza postulaciones, registra bloqueos, gestiona torneos, administra deudas y tarifas.
- **Delegado**: responsable operativo de un equipo. Inscribe al equipo pero no lo edita (RN-005). Delegados secundarios → v2.
- **Creador de franquicia**: asigna delegados (RN-011).
- **Jugador**: participa en equipos. Confirmar si siempre es usuario de la plataforma.

---

## Enums

### Rango horario (para amistosos y partidos)

- `MAÑANA` — 9 a 12
- `MEDIODIA` — 12 a 15
- `TARDE` — 15 a 18
- `NOCHE` — 18 a 21

---

## Estados de postulación/inscripción de equipo

*A modelar formalmente.* Estados tentativos derivados de RN-013, RN-014, RN-015, RN-016:

- `PENDIENTE` — postulado, esperando revisión de admin.
- `RECHAZADA` — admin rechazó la postulación.
- `APROBADA_SIN_PAGO` — admin aprobó, pero faltan pagos (inscripción y/o seguros).
- `PLAZA_ASEGURADA` — pagó inscripción pero no los seguros. Tiene la plaza, pero no puede jugar (RN-016).
- `OFICIAL` — ambos pagos (inscripción + seguros) completados. Listo para jugar.
