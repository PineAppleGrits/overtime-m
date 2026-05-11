# Backend Module Pattern

Patrón objetivo para módulos backend nuevos o migrados en `apps/api/src/<feature>`.

## Estructura estándar

```text
<feature>/
├── application/
│   ├── ports/
│   ├── services/
│   └── use-cases/
├── domain/
│   ├── entities/
│   └── rules/
├── infrastructure/
│   ├── adapters/
│   ├── listeners/
│   └── repositories/
├── presentation/
│   ├── controllers/
│   ├── dto/
│   └── mappers/
└── <feature>.module.ts
```

## Convenciones

- `presentation/controllers` es la única ubicación válida para controllers activos.
- `application/services` expone la facade interna del módulo cuando varios use-cases comparten orquestación o cuando otros módulos necesitan un punto de entrada estable.
- `application/use-cases` contiene casos de uso finos, orientados a endpoint o workflow.
- `application/ports` define las dependencias hacia infraestructura o hacia otros contextos del sistema.
- `domain/rules` se reserva para reglas puras, sin I/O ni acceso a Nest o Prisma.
- `infrastructure/repositories` implementa acceso a Prisma u otras fuentes de datos.
- `infrastructure/adapters` envuelve servicios concretos, SDKs, event emitters, storage o módulos legacy aún necesarios.

## Cuándo usar `application/services`

Usar una facade en `application/services` cuando:

- varios use-cases necesitan la misma orquestación compleja
- el módulo necesita exportar una API interna estable
- hay reglas de negocio que no conviene duplicar entre controladores o use-cases

No usarla como reemplazo de un service legacy gigante: si crece demasiado, dividir primero en puertos, reglas de dominio o helpers internos.

## Cuándo crear `ports`

Crear un port cuando el código de `application` dependa de:

- Prisma o queries de base de datos
- storage, email, event bus o SDKs externos
- otro módulo con lógica propia
- reglas configurables por deporte, torneo o contexto

No crear ports para funciones puras o validaciones locales del mismo módulo.

## Política de exports del módulo

- Exportar solo facades application o servicios explícitamente consumidos por otros módulos.
- No exportar controllers.
- No exportar adapters o repositories salvo que otro módulo tenga un motivo real para depender de esa implementación concreta.
- Si un módulo necesita compatibilidad interna, preferir exportar una facade estable antes que volver a exponer un service legacy.

## Compatibilidad interna

- Mantener contratos HTTP estables durante migraciones.
- Resolver compatibilidad cross-módulo con ports + adapters, no con acceso directo a `PrismaService` desde otro feature.
- Si un módulo todavía convive con piezas heredadas, la dependencia debe quedar encapsulada en `infrastructure/adapters`.

## Referencias del repo

- Base arquitectónica: [docs/implementation-plan.md](/C:/Users/ginos/Desktop/overtime-mono/docs/implementation-plan.md)
- Ejemplos maduros: `payments`, `venues`, `auth`, `teams`, `registrations`

