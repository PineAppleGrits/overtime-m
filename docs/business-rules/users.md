# Reglas de Negocio — Usuarios y Registro

## RN-033 — Registro orgánico con Google sin DNI

- **Contexto**: Alta de usuario por OAuth de Google.
- **Regla**: El registro orgánico mediante Google **no exige DNI** al momento del alta. El usuario queda creado sin documento y debe completarlo posteriormente desde su perfil.
- **Motivo**: Minimizar fricción de registro. El DNI se exige recién cuando el usuario intenta ejercer acciones que lo requieren (ver [RN-034](#rn-034--dni-obligatorio-para-crear-equipo) y [RN-035](#rn-035--dni-como-nexo-con-registros-previos)).

## RN-034 — DNI obligatorio para crear equipo

- **Contexto**: Creación de equipo por un usuario.
- **Regla**: Un usuario **no puede crear un equipo** sin DNI validado.
- **Relación**: Ver [RN-001](./teams.md#rn-001--lista-de-buena-fe-al-crear-equipo).

## RN-035 — DNI como nexo con registros previos

- **Contexto**: Usuario que se registra habiendo sido anotado previamente en un equipo sin tener cuenta.
- **Regla**: Un jugador puede ser anotado en un equipo **sin tener cuenta** en la plataforma. Cuando esa persona luego se registra, el **DNI validado es el nexo** que vincula la cuenta nueva con los registros previos. Sin DNI validado, el usuario **no puede ser asociado** a los equipos donde figuraba anotado.
- **Motivo**: Identidad verificada para unificar histórico del jugador (suspensiones, estadísticas, seguros).

## RN-036 — Validación de DNI por foto

- **Contexto**: Carga de DNI del usuario.
- **Regla**: El DNI se valida mediante **foto** del documento subida por el usuario.
- **Notas**: El **método técnico** de verificación (IA / OCR automático, lector físico de DNI, revisión manual o combinación) queda **a definir junto al equipo técnico**. Umbral de confianza y flujo ante rechazo se resuelven como parte de esa definición.

## RN-057 — Asignación de roles por el staff

- **Contexto**: Otorgamiento de roles distintos al de jugador (admin, master, árbitro, oficial, fotógrafo, coordinador, etc.).
- **Regla**: Los roles son asignados por el **staff** de la plataforma. El mecanismo admite dos variantes:
  1. **Cuenta pre-creada**: el staff crea una cuenta con un rol y un email asociado. Cuando el usuario se registra con ese email (ej: vía Google — ver [RN-033](#rn-033--registro-orgánico-con-google-sin-dni)), los perfiles se **asocian automáticamente** y el rol queda activo en su cuenta.
  2. **Cuenta existente**: sobre una cuenta ya registrada, el staff **cambia el rol** directamente.
- **Notas**: Los roles que no sean "jugador" no se alcanzan por flujo orgánico — no hay autoservicio para volverse admin, árbitro, etc.
