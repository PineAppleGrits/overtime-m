# Estándares de Código

## TypeScript

### Configuración
- Usar TypeScript estricto (`strict: true`)
- **NUNCA usar `any`** - usar `unknown` si es necesario
- Preferir tipos explícitos sobre inferencia cuando mejore la legibilidad
- Usar interfaces para objetos, types para uniones/intersections

### Nombres
- **Variables y funciones:** camelCase
- **Clases y tipos:** PascalCase
- **Constantes:** UPPER_SNAKE_CASE
- **Archivos:** kebab-case para componentes, camelCase para utilidades

### Ejemplos

```typescript
// ✅ Correcto
interface User {
  id: string;
  email: string;
}

const getUserById = async (userId: string): Promise<User | null> => {
  // ...
};

// ❌ Incorrecto
const getUser = async (id: any) => {
  // ...
};
```

## Imports

### Orden de Imports
1. Librerías externas
2. Imports internos absolutos
3. Imports relativos
4. Types (con `type` keyword)

```typescript
// ✅ Correcto
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { User } from '@prisma/client';
```

### Evitar
- Imports circulares
- Imports de tipos sin `type` cuando solo se usan para tipos

## Funciones

### Principios
- Funciones pequeñas y con una sola responsabilidad
- Máximo 3 parámetros (usar objetos si es necesario)
- Nombres descriptivos que indiquen qué hacen
- Preferir funciones puras cuando sea posible

```typescript
// ✅ Correcto
const calculateTeamStats = (matches: Match[]): TeamStats => {
  // ...
};

// ❌ Incorrecto
const calc = (m: Match[]) => {
  // ...
};
```

## Manejo de Errores

### Backend (NestJS)
- Usar excepciones de NestJS (`NotFoundException`, `BadRequestException`, etc.)
- Crear excepciones personalizadas cuando sea necesario
- Nunca exponer detalles internos en errores de producción

```typescript
// ✅ Correcto
if (!user) {
  throw new NotFoundException('User not found');
}
```

### Frontend (Next.js)
- Usar Error Boundaries para errores de React
- Manejar errores de API con try/catch
- Mostrar mensajes de error amigables al usuario

```typescript
// ✅ Correcto
try {
  const data = await fetchData();
} catch (error) {
  console.error('Error fetching data:', error);
  toast.error('No se pudo cargar la información');
}
```

## Comentarios

### Cuándo Comentar
- **SÍ:** Explicar "por qué" cuando la lógica no es obvia
- **SÍ:** Documentar funciones complejas
- **NO:** Comentar código obvio
- **NO:** Dejar código comentado (usar Git)

```typescript
// ✅ Correcto
// Validamos que el jugador no esté en otra categoría del mismo torneo
// para evitar conflictos de horarios
if (isPlayerInSameTournamentCategory(playerId, tournamentId)) {
  throw new ConflictException('Player already in another category');
}

// ❌ Incorrecto
// Incrementa el contador
counter++;
```

## Formato

- Usar Prettier con configuración del proyecto
- Líneas máximo 100 caracteres (preferir 80)
- Usar punto y coma
- Comillas simples para strings (TypeScript/JavaScript)
- 2 espacios para indentación

## Archivos

### Organización
- Un archivo = una responsabilidad principal
- Máximo ~300 líneas por archivo
- Separar en múltiples archivos si crece demasiado

### Nombres de Archivos
- Componentes React: `PascalCase.tsx` (ej: `UserCard.tsx`)
- Utilidades: `camelCase.ts` (ej: `formatDate.ts`)
- Servicios: `camelCase.service.ts` (ej: `user.service.ts`)
- DTOs: `kebab-case.dto.ts` (ej: `create-user.dto.ts`)

