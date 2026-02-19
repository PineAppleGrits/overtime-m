# Guías para Base de Datos y Prisma

## Schema de Prisma

### Convenciones de Nombres
- **Modelos:** PascalCase, singular (ej: `User`, `Tournament`)
- **Campos:** camelCase (ej: `createdAt`, `userId`)
- **Relaciones:** nombres descriptivos

```prisma
// ✅ Correcto
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  teams     Team[]
  player    Player?
}

model Team {
  id        String   @id @default(uuid())
  name      String
  logoUrl   String?
  creatorId String
  creator   User     @relation(fields: [creatorId], references: [id])
  
  @@index([creatorId])
}
```

### Tipos de Datos
- `String` para textos
- `Int` para números enteros
- `Float` para decimales
- `Boolean` para booleanos
- `DateTime` para fechas
- `Json` para datos estructurados (estadísticas en vivo)

### Relaciones

#### One-to-Many
```prisma
model Tournament {
  id         String     @id @default(uuid())
  categories Category[]
}

model Category {
  id          String     @id @default(uuid())
  tournamentId String
  tournament Tournament @relation(fields: [tournamentId], references: [id])
}
```

#### Many-to-Many
```prisma
model Team {
  id       String   @id @default(uuid())
  players  PlayerTeam[]
}

model Player {
  id      String      @id @default(uuid())
  teams   PlayerTeam[]
}

model PlayerTeam {
  teamId   String
  playerId String
  team     Team   @relation(fields: [teamId], references: [id])
  player   Player @relation(fields: [playerId], references: [id])
  
  @@unique([teamId, playerId])
  @@index([teamId])
  @@index([playerId])
}
```

#### One-to-One
```prisma
model User {
  id     String  @id @default(uuid())
  player Player?
}

model Player {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

## Índices

### Cuándo Crear Índices
- Campos usados frecuentemente en `WHERE`
- Foreign keys
- Campos usados en `ORDER BY`
- Campos usados en búsquedas

```prisma
model Match {
  id        String   @id @default(uuid())
  venueId   String
  status    String
  matchDate DateTime
  
  venue Venue @relation(fields: [venueId], references: [id])
  
  @@index([venueId])
  @@index([status])
  @@index([matchDate])
  @@index([status, matchDate]) // Índice compuesto
}
```

## Soft Deletes

### Implementación
- Usar campo `deletedAt` en lugar de eliminar físicamente
- Filtrar en queries por defecto

```prisma
model User {
  id        String    @id @default(uuid())
  deletedAt DateTime?
  
  @@index([deletedAt])
}
```

```typescript
// En PrismaService
async findMany(args: any) {
  return this.prisma.user.findMany({
    ...args,
    where: {
      ...args.where,
      deletedAt: null,
    },
  });
}
```

## Migraciones

### Principios
- **Nunca editar migraciones existentes**
- Crear nueva migración para cambios
- Revisar SQL generado antes de aplicar
- Usar nombres descriptivos

```bash
# ✅ Correcto
npx prisma migrate dev --name add_user_phone_verification
```

### Migraciones de Datos
- Separar migraciones de schema de migraciones de datos
- Usar scripts de seed para datos iniciales

```typescript
// prisma/seed.ts
async function main() {
  // Datos iniciales
  await prisma.sport.create({
    data: { name: 'Basketball', code: 'BASKET' },
  });
}
```

## Queries

### Mejores Prácticas
- Usar `select` para limitar campos
- Usar `include` para relaciones necesarias
- Paginación siempre que sea posible
- Evitar N+1 queries

```typescript
// ✅ Correcto - Evita N+1
const tournaments = await prisma.tournament.findMany({
  include: {
    categories: {
      include: {
        zones: {
          include: {
            teams: true,
          },
        },
      },
    },
  },
});

// ❌ Incorrecto - N+1 query
const tournaments = await prisma.tournament.findMany();
for (const tournament of tournaments) {
  tournament.categories = await prisma.category.findMany({
    where: { tournamentId: tournament.id },
  });
}
```

### Transacciones
- Usar para operaciones múltiples que deben ser atómicas
- Manejar rollback en caso de error

```typescript
// ✅ Correcto
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const team = await tx.team.create({
    data: { ...teamData, creatorId: user.id },
  });
  return { user, team };
});
```

## Validaciones

### Nivel de Base de Datos
- Constraints únicos (`@unique`)
- Foreign keys (`@relation`)
- Validaciones básicas (longitud, formato)

### Nivel de Aplicación
- Validaciones complejas en servicios
- DTOs con class-validator

```prisma
model User {
  email String @unique // Constraint a nivel de BD
  phone String? @unique
}
```

```typescript
// Validación en servicio
async create(dto: CreateUserDto) {
  // Validación de negocio
  if (await this.isEmailTaken(dto.email)) {
    throw new ConflictException('Email already exists');
  }
  // ...
}
```

## Performance

### Optimizaciones
- Índices estratégicos
- Paginación
- Lazy loading de relaciones pesadas
- Caching cuando sea apropiado

```typescript
// ✅ Correcto - Paginación
const users = await prisma.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});
```

## Seguridad

### Row Level Security (RLS)
- Configurar en Supabase para seguridad adicional
- Políticas de acceso por usuario/rol

### Validación de Entrada
- Siempre validar en backend
- Nunca confiar en validación del frontend
- Sanitizar inputs

## Estadísticas en Vivo (JSON)

### Almacenamiento
- Usar tipo `Json` de Prisma
- Estructura consistente
- Procesar al finalizar partido

```prisma
model Match {
  id            String   @id @default(uuid())
  liveStatsJson Json?     // Minuto a minuto
  processedStats Json?    // Estadísticas procesadas
}
```

```typescript
// Estructura sugerida
interface LiveStats {
  events: Array<{
    timestamp: string;
    type: 'point' | 'foul' | 'timeout' | 'substitution';
    playerId?: string;
    teamId: string;
    data: Record<string, any>;
  }>;
  score: {
    home: number;
    away: number;
  };
}
```

