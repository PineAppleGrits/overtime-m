# Plan de Implementación - Alta Prioridad

Este documento detalla los cambios necesarios para implementar las mejoras de alta prioridad identificadas en el análisis del backend.

---

## 1. Mover Transiciones Automáticas de Estado a Cron Job

### Problema Actual
En `tournaments.service.ts`, el método `applyAutomaticStatusTransitions()` se ejecuta en **cada request** a `findAll()` y `findOne()`. Esto causa:
- Queries innecesarias en cada request
- Posibles race conditions
- Overhead de performance

### Solución Propuesta
Mover la lógica a un cron job que se ejecute periódicamente (cada hora o cada 15 minutos).

### Archivos a Modificar/Crear

#### 1.1 Instalar dependencia
```bash
pnpm add @nestjs/schedule
```

#### 1.2 Crear módulo de tareas programadas
**Crear:** `src/tasks/tasks.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ScheduleModule.forRoot(), DatabaseModule],
  providers: [TasksService],
})
export class TasksModule {}
```

#### 1.3 Crear servicio de tareas
**Crear:** `src/tasks/tasks.service.ts`
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ejecutar transiciones automáticas de estado de torneos
   * Se ejecuta cada 15 minutos
   */
  @Cron(CronExpression.EVERY_15_MINUTES)
  async handleTournamentStatusTransitions() {
    this.logger.log('Running tournament status transitions...');
    const now = new Date();

    try {
      // Cambiar a inscripcion_cerrada si la fecha de fin de inscripción pasó
      const closedRegistrations = await this.prisma.tournament.updateMany({
        where: {
          status: { in: ['visible', 'invisible'] },
          registrationEndDate: { lte: now },
          deletedAt: null,
        },
        data: { status: 'inscripcion_cerrada' },
      });

      if (closedRegistrations.count > 0) {
        this.logger.log(
          `Closed registrations for ${closedRegistrations.count} tournaments`,
        );
      }

      // Cambiar a finalizado si la fecha de fin pasó
      const finishedTournaments = await this.prisma.tournament.updateMany({
        where: {
          status: 'inscripcion_cerrada',
          endDate: { lte: now },
          deletedAt: null,
        },
        data: { status: 'finalizado' },
      });

      if (finishedTournaments.count > 0) {
        this.logger.log(
          `Finished ${finishedTournaments.count} tournaments`,
        );
      }
    } catch (error) {
      this.logger.error('Error in tournament status transitions', error);
    }
  }

  /**
   * Limpiar tokens expirados, sesiones antiguas, etc.
   * Se ejecuta diariamente a las 3:00 AM
   */
  @Cron('0 3 * * *')
  async handleDailyCleanup() {
    this.logger.log('Running daily cleanup...');
    // Implementar limpieza de datos antiguos si es necesario
  }
}
```

#### 1.4 Modificar TournamentsService
**Modificar:** `src/tournaments/tournaments.service.ts`

Eliminar las llamadas a `applyAutomaticStatusTransitions()` de:
- `findAll()` (línea ~167)
- `findOne()` (línea ~231)

```diff
  async findAll(paginationDto: PaginationDto, status?: string) {
-   // Aplicar transiciones automáticas antes de listar
-   await this.applyAutomaticStatusTransitions();

    const { page = 1, limit = 10, ... } = paginationDto;
    // resto del código...
  }

  async findOne(id: string) {
-   // Aplicar transiciones automáticas antes de obtener
-   await this.applyAutomaticStatusTransitions();

    const tournament = await this.prisma.tournament.findUnique({
    // resto del código...
  }
```

También eliminar el método privado `applyAutomaticStatusTransitions()` ya que ahora estará en TasksService.

#### 1.5 Registrar módulo en AppModule
**Modificar:** `src/app.module.ts`
```diff
+ import { TasksModule } from './tasks/tasks.module';

  @Module({
    imports: [
      ConfigModule.forRoot({ ... }),
      ThrottlerModule.forRootAsync({ ... }),
      DatabaseModule,
      AuthModule,
+     TasksModule,
      // ... otros módulos
    ],
  })
```

---

## 2. Implementar Cache para Standings

### Problema Actual
El cálculo de standings en `fixtures.service.ts` se realiza en cada request, recalculando posiciones, puntos, diferencia de gol, etc.

### Solución Propuesta
Implementar cache en memoria o Redis para standings con TTL de 60 segundos.

### Archivos a Modificar/Crear

#### 2.1 Instalar dependencia
```bash
pnpm add @nestjs/cache-manager cache-manager
```

#### 2.2 Configurar cache en AppModule
**Modificar:** `src/app.module.ts`
```typescript
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 segundos por defecto
      max: 100, // máximo 100 items en cache
    }),
    // ... otros imports
  ],
})
```

#### 2.3 Usar cache en StandingsService
**Modificar:** `src/fixtures/generators/standings.service.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class StandingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getCategoryStandings(categoryId: string): Promise<CategoryStandings> {
    const cacheKey = `standings:${categoryId}`;
    
    // Intentar obtener del cache
    const cached = await this.cacheManager.get<CategoryStandings>(cacheKey);
    if (cached) {
      return cached;
    }

    // Calcular standings
    const standings = await this.calculateStandings(categoryId);
    
    // Guardar en cache con TTL de 60 segundos
    await this.cacheManager.set(cacheKey, standings, 60000);
    
    return standings;
  }

  // Método para invalidar cache cuando se actualiza un partido
  async invalidateStandingsCache(categoryId: string): Promise<void> {
    const cacheKey = `standings:${categoryId}`;
    await this.cacheManager.del(cacheKey);
  }
}
```

#### 2.4 Invalidar cache cuando finaliza un partido
**Modificar:** `src/matches/matches.service.ts`
```typescript
// En el método changeStatus, después de cambiar a 'finalizado':
if (changeStatusDto.status === MatchStatus.FINALIZADO && match.categoryId) {
  // Invalidar cache de standings
  await this.standingsService.invalidateStandingsCache(match.categoryId);
}
```

#### 2.5 (Opcional) Usar Redis para producción
Para producción con múltiples instancias, usar Redis:
```bash
pnpm add cache-manager-redis-store redis
```

```typescript
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    store: await redisStore({
      url: process.env.REDIS_URL,
    }),
    ttl: 60000,
  }),
}),
```

---

## 3. Compresión de Respuestas

### Estado
**YA IMPLEMENTADO** en `main.ts` con el paquete `compression`.

```typescript
import compression from 'compression';
app.use(compression());
```

---

## Resumen de Cambios

| Tarea | Archivos | Esfuerzo |
|-------|----------|----------|
| Cron Jobs | 3 nuevos, 2 modificados | Medio |
| Cache Standings | 2 modificados | Bajo |
| Compresión | ✅ Completado | - |

### Orden de Implementación Recomendado
1. **Primero:** Cron jobs (elimina overhead inmediato)
2. **Segundo:** Cache de standings (mejora performance de consultas frecuentes)

### Dependencias a Instalar
```bash
pnpm add @nestjs/schedule @nestjs/cache-manager cache-manager
# Opcional para producción:
pnpm add cache-manager-redis-store redis
```

### Tests a Agregar
1. Test que verifica que el cron job actualiza estados correctamente
2. Test que verifica que el cache se invalida al finalizar partido
3. Test que verifica TTL del cache

---

## Consideraciones Adicionales

### Monitoreo
- Agregar métricas para el cron job (tiempo de ejecución, errores)
- Agregar métricas de hit/miss ratio del cache

### Configuración por Ambiente
```typescript
// config/tasks.config.ts
export default registerAs('tasks', () => ({
  tournamentStatusCron: process.env.TOURNAMENT_STATUS_CRON || '*/15 * * * *',
  standingsCacheTtl: parseInt(process.env.STANDINGS_CACHE_TTL || '60000', 10),
}));
```

### Logging
El TasksService ya incluye logging, pero considerar agregar:
- Notificación cuando un torneo cambia de estado automáticamente
- Alertas si el cron job falla múltiples veces seguidas
