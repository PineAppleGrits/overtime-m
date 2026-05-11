# Overtime Backend - NestJS API

Backend del sistema de gestión de torneos deportivos Overtime.

## Tecnologías

- **Framework:** NestJS 11
- **Runtime:** Node.js 22+ (soporte nativo de `.env`)
- **Base de Datos:** PostgreSQL (Supabase)
- **ORM:** Prisma 7.2
- **Autenticación:** Supabase Auth (validación de tokens)
- **Validación:** class-validator + class-transformer
- **TypeScript:** 5.7

### 🆕 Novedades Prisma 7

- ✅ **No requiere `url` en el datasource** del schema
- ✅ Configuración centralizada en `prisma.config.ts`
- ✅ API simplificada: `datasourceUrl` en el constructor
- ✅ Mejor integración con Node.js 22+

## Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
├── common/                  # Código compartido (guards, decorators, filters, etc.)
├── config/                  # Configuraciones
├── database/                # Prisma service y configuración
└── main.ts                  # Punto de entrada
```

## Configuración Inicial

### 1. Instalar Dependencias

```bash
pnpm install
```

**Dependencias clave:**
- `@prisma/client@7.2.0` - Cliente de Prisma ORM
- `@prisma/adapter-pg@7.2.0` - Adapter para PostgreSQL (requerido en Prisma 7)
- `pg@8.16.3` - Driver nativo de PostgreSQL
- `prisma@7.2.0` - CLI de Prisma (dev)

### 2. Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

Variables requeridas:

```env
# Database - Obtén esta URL de tu proyecto Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# Supabase - Obtén estas keys de tu proyecto Supabase
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"

# Application
PORT=3000
NODE_ENV="development"

# CORS - URL del frontend
CORS_ORIGIN="http://localhost:3001"
```

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Habilita Google OAuth en Authentication > Providers
3. Copia las credenciales a tu archivo `.env`

### 4. Generar Cliente de Prisma

```bash
pnpm prisma:generate
```

> **Nota:** Node.js 22+ carga automáticamente las variables de entorno desde `.env`. No necesitas `dotenv` ni otras librerías.

### 5. Crear Migración Inicial

```bash
pnpm prisma:migrate
```

Cuando te pregunte por el nombre, usa: `init`

### 6. Ejecutar Seed (Datos Iniciales)

```bash
pnpm prisma:seed
```

Esto creará:
- Deporte: Basketball
- Roles: admin, player, referee, table_official, photographer
- Permisos básicos por módulo (CRUD para todos los módulos)

## Desarrollo

### Iniciar servidor de desarrollo

```bash
pnpm start:dev
```

El servidor estará disponible en `http://localhost:3000/api`

### Endpoints disponibles

- `GET /api` - Health check
- `GET /api/health` - Status del servidor
- `GET /api/auth/me` - Perfil del usuario autenticado (requiere token de Supabase)

## Scripts Disponibles

```bash
# Desarrollo
pnpm start:dev          # Servidor con hot-reload
pnpm start:debug        # Debug mode

# Build
pnpm build              # Compilar para producción
pnpm start:prod         # Iniciar en producción

# Prisma
pnpm prisma:generate    # Generar cliente de Prisma
pnpm prisma:migrate     # Crear migración
pnpm prisma:studio      # Abrir Prisma Studio (UI)
pnpm prisma:seed        # Ejecutar seed

# Testing
pnpm test               # Unit tests
pnpm test:watch         # Watch mode
pnpm test:cov           # Coverage
pnpm test:e2e           # E2E tests

# Linting
pnpm lint               # Ejecutar ESLint
pnpm format             # Formatear código
```

## Arquitectura

### 🔐 Autenticación

**IMPORTANTE:** Este backend NO maneja login/register/logout. La autenticación se maneja completamente en el frontend con Supabase Auth.

**Flujo:**
1. Frontend (Next.js) maneja OAuth con Supabase
2. Frontend obtiene `access_token` de Supabase
3. Frontend envía el token en cada request: `Authorization: Bearer <token>`
4. Backend valida el token con Supabase y sincroniza el usuario automáticamente

Ver [ARQUITECTURA-AUTH.md](./ARQUITECTURA-AUTH.md) para más detalles.

### Módulos

- **AuthModule:** Validación de tokens de Supabase y sincronización de usuarios
- **DatabaseModule:** Prisma service (global)
- **ConfigModule:** Variables de entorno (global)

### Patrón de módulos backend

La convención actual para módulos nuevos o migrados vive en
[docs/backend-module-pattern.md](/C:/Users/ginos/Desktop/overtime-mono/docs/backend-module-pattern.md).
Tomar ese documento como fuente de verdad para `application/ports`,
`infrastructure/*` y `presentation/controllers`.


### Guards

- **AuthGuard:** Verifica JWT token en todas las rutas (excepto las marcadas con `@Public()`)
- **RolesGuard:** Verifica roles del usuario con `@Roles(...)`

### Decorators

- `@Public()` - Marca una ruta como pública (sin autenticación)
- `@Roles('admin', 'player')` - Requiere uno de los roles especificados
- `@CurrentUser()` - Obtiene el usuario actual del request

### Ejemplo de uso

```typescript
@Controller('tournaments')
export class TournamentsController {
  
  @Public()  // Marca ruta como pública (sin autenticación)
  @Get()
  findAll() {
    // Cualquiera puede acceder
  }

  @Roles('admin')  // Solo usuarios con rol 'admin'
  @Post()
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: any) {
    // user.id, user.email, user.roles disponibles
    console.log(user);
  }
}
```

**Nota:** Por defecto, TODAS las rutas requieren autenticación a menos que uses `@Public()`

## Base de Datos

### 🆕 Prisma 7 - Configuración Moderna

Este proyecto usa **Prisma 7.2** con las siguientes mejoras:

#### Schema sin `url`
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  // ✅ No url aquí - se configura en prisma.config.ts
}
```

#### Configuración centralizada
```typescript
// prisma.config.ts
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || '',
  },
});
```

#### Cliente de Prisma con Adapter
```typescript
// src/database/prisma.service.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

constructor(private configService: ConfigService) {
  // Prisma 7: Usar adapter de PostgreSQL
  const connectionString = configService.get<string>('DATABASE_URL');
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  super({
    adapter, // ✅ Adapter pattern para mejor control de conexiones
    log: [...],
  });
}
```

**Beneficios de Prisma 7:**
- ✅ Configuración centralizada y más limpia
- ✅ Separación de schema y configuración
- ✅ **Adapter pattern** para mejor control de conexiones
- ✅ Pool de conexiones optimizado con `pg`
- ✅ Mayor flexibilidad para edge runtimes

### Prisma Studio

Para visualizar y editar datos:

```bash
pnpm prisma:studio
```

### Crear Migraciones

```bash
pnpm prisma:migrate
```

### Soft Deletes

Los modelos tienen soft delete implementado. Usar `deletedAt` para marcar como eliminado:

```typescript
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Despliegue

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables de entorno en tu plataforma de hosting.

### Migraciones en Producción

```bash
pnpm prisma:migrate:prod
```

## Próximos Pasos

Ver el [ROADMAP de Implementación](../ROADMAP-Implementacion.md) para las siguientes funcionalidades a implementar:

- Sprint 1.2: Módulo de Usuarios
- Sprint 1.3: Módulo de Equipos y Deportes
- Sprint 1.4: Módulo de Torneos
- ...

## Recursos

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)

## Licencia

UNLICENSED
