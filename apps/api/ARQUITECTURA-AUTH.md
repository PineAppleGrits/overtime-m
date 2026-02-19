# Arquitectura de Autenticación - Backend Overtime

## 🔐 Flujo de Autenticación

Este backend **NO maneja login/register/logout**. Toda la autenticación se maneja en el frontend con Supabase Auth.

### Frontend (Next.js)
1. Usuario hace login con Google OAuth via Supabase Auth
2. Supabase retorna un `access_token`
3. Frontend guarda el token (en cookies/localStorage)
4. Frontend envía el token en cada request al backend:
   ```
   Authorization: Bearer <supabase_access_token>
   ```

### Backend (NestJS)
1. **AuthGuard** intercepta cada request
2. Extrae el token del header `Authorization`
3. Valida el token con Supabase (`auth.getUser()`)
4. Si el usuario no existe en nuestra BD, lo crea automáticamente
5. Agrega el usuario al `request` para que esté disponible en los controladores
6. Permite el acceso al recurso

## 📁 Estructura

```
src/
├── auth/
│   ├── auth.service.ts          # Validación de tokens y sincronización de usuarios
│   ├── auth.controller.ts       # Solo endpoint GET /auth/me
│   └── auth.module.ts           
├── common/
│   ├── guards/
│   │   ├── auth.guard.ts        # Valida tokens de Supabase
│   │   └── roles.guard.ts       # Verifica roles del usuario
│   └── decorators/
│       ├── public.decorator.ts  # Marca rutas públicas
│       ├── roles.decorator.ts   # Requiere roles específicos
│       └── current-user.decorator.ts # Obtiene usuario del request
```

## 🔑 Endpoints de Auth

### `GET /api/auth/me`
Obtiene el perfil completo del usuario autenticado.

**Headers:**
```
Authorization: Bearer <supabase_access_token>
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "phone": "+54...",
  "phoneVerified": false,
  "documentVerified": false,
  "roles": ["player"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🛡️ Protección de Rutas

### Rutas Públicas (sin autenticación)
```typescript
@Controller('tournaments')
export class TournamentsController {
  
  @Public()  // ← Marca la ruta como pública
  @Get()
  findAll() {
    // Cualquiera puede acceder
  }
}
```

### Rutas Protegidas (requiere autenticación)
```typescript
@Controller('teams')
export class TeamsController {
  
  @Post()  // ← Por defecto requiere autenticación
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: any) {
    // Solo usuarios autenticados
    console.log(user.id, user.email, user.roles);
  }
}
```

### Rutas con Roles Específicos
```typescript
@Controller('users')
export class UsersController {
  
  @Roles('admin')  // ← Solo admins pueden acceder
  @Get()
  findAll() {
    // Solo usuarios con rol 'admin'
  }
  
  @Roles('admin', 'referee')  // ← Admins O referees
  @Post()
  create() {
    // Usuarios con rol 'admin' o 'referee'
  }
}
```

## 🎯 Obtener Usuario Actual

En cualquier controlador:

```typescript
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('teams')
export class TeamsController {
  
  @Post()
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: any,  // ← Usuario completo
    @CurrentUser('id') userId: string,  // ← Solo el ID
    @CurrentUser('email') email: string,  // ← Solo el email
  ) {
    console.log(user.id);        // uuid
    console.log(user.email);     // user@example.com
    console.log(user.roles);     // ['player']
    console.log(user.name);      // John Doe
  }
}
```

## 🔄 Sincronización Automática

Cuando un usuario hace su primer request:
1. El token de Supabase se valida
2. Se busca el usuario en nuestra BD por `supabaseAuthId`
3. Si NO existe:
   - Se crea automáticamente con los datos de Supabase
   - Se le asigna el rol 'player' por defecto
4. Se agrega al request y continúa el flujo

**Esto significa que NO necesitas un endpoint de registro separado.**

## ⚙️ Configuración

En `.env`:
```env
# Supabase (REQUERIDO)
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="eyJ..."

# Database (REQUERIDO)
DATABASE_URL="postgresql://..."

# CORS (Permitir requests del frontend)
CORS_ORIGIN="http://localhost:3001"
```

## 🚀 Ventajas de esta Arquitectura

1. **Simplicidad:** El backend no maneja OAuth
2. **Seguridad:** Los tokens de Supabase son validados directamente
3. **Sincronización:** Los usuarios se crean automáticamente
4. **Flexibilidad:** Fácil agregar más providers OAuth en el frontend
5. **Escalabilidad:** Supabase maneja la carga de autenticación

## 📝 Ejemplo Completo

```typescript
// Frontend (Next.js)
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch('http://localhost:3000/api/teams', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: 'Mi Equipo' }),
});

// Backend (NestJS)
@Controller('teams')
export class TeamsController {
  @Post()
  async create(
    @Body() dto: CreateTeamDto,
    @CurrentUser() user: any,  // ← Usuario ya autenticado y sincronizado
  ) {
    return this.teamsService.create({
      ...dto,
      creatorId: user.id,  // ← Usar el ID de nuestra BD
    });
  }
}
```

## 🔍 Debugging

Si tienes problemas de autenticación:

1. Verifica que el token de Supabase sea válido en el frontend
2. Revisa los logs del backend (AuthGuard muestra errores)
3. Asegúrate que `SUPABASE_URL` y `SUPABASE_ANON_KEY` estén configurados
4. Verifica que el header `Authorization` se esté enviando correctamente

## ✅ Checklist

- [ ] Frontend obtiene token de Supabase Auth
- [ ] Frontend envía token en header `Authorization: Bearer <token>`
- [ ] Backend valida token con Supabase
- [ ] Usuario se crea automáticamente en primera autenticación
- [ ] Guards protegen las rutas correctamente
- [ ] Decorador `@CurrentUser()` funciona en controladores

