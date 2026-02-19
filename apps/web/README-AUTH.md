# 🎯 Supabase Auth - Implementación Completa

## ✅ ¿Qué se implementó?

### 1. **Configuración de Supabase**
- ✅ Instalación de `@supabase/supabase-js` y `@supabase/ssr`
- ✅ Cliente de Supabase para browser (`lib/supabase/client.ts`)
- ✅ Cliente de Supabase para server (`lib/supabase/server.ts`)
- ✅ Middleware helper (`lib/supabase/middleware.ts`)

### 2. **Middleware de Protección de Rutas**
- ✅ `middleware.ts` global
- ✅ Protección automática de rutas:
  - `/admin/*`
  - `/profile/*`
  - `/teams/create`
- ✅ Redirección automática a `/auth/login` si no está autenticado
- ✅ Redirección a home si ya está autenticado e intenta acceder a `/auth/*`

### 3. **AuthProvider + Context**
- ✅ `providers/AuthProvider.tsx`
- ✅ Hook `useAuth()` con:
  - `user` - Usuario de Supabase
  - `profile` - Profile del backend (con roles, playerId, etc.)
  - `session` - Sesión activa de Supabase
  - `loading` - Estado de carga
  - `signInWithGoogle()` - Iniciar sesión con Google
  - `signOut()` - Cerrar sesión
  - `refreshProfile()` - Refrescar profile desde backend

### 4. **Páginas de Autenticación**
- ✅ `/auth/login` - Página de login con Google OAuth
- ✅ `/auth/callback` - Callback de OAuth (route handler)
- ✅ `/auth/error` - Página de error de autenticación

### 5. **Componentes**
- ✅ `<UserMenu />` - Menú de usuario con:
  - Avatar/Inicial
  - Nombre y email
  - Indicador si tiene perfil de jugador
  - Botón "Crear perfil de jugador" (si no tiene)
  - Links a equipos, perfil, admin
  - Cerrar sesión

### 6. **Integración con Backend**
- ✅ `baseClient.ts` actualizado con interceptor de auth
- ✅ Automáticamente envía `Authorization: Bearer {token}` en todas las requests
- ✅ Manejo de 401 con redirección automática a login

### 7. **Flujo de Creación de Perfil de Jugador**
- ✅ `/profile/create-player` - Página para crear perfil de jugador
- ✅ Endpoint en backend: `POST /api/auth/create-player-profile`
- ✅ DTO de validación: `CreatePlayerProfileDto`

---

## 🚀 Próximos Pasos

### 1. Configurar Variables de Entorno

Crea `.env.local` en `overtime-fe/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Configurar Supabase

1. Ir a https://supabase.com/dashboard
2. **Authentication → Providers → Google**
   - Habilitar Google
   - Agregar Client ID y Client Secret de Google Cloud
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3001`
   - Redirect URLs: `http://localhost:3001/auth/callback`

### 3. Configurar Google Cloud

1. Ir a https://console.cloud.google.com
2. Crear proyecto (si no existe)
3. Habilitar **Google+ API**
4. **APIs & Services → Credentials → Create OAuth Client ID**
   - Tipo: Web application
   - Authorized JavaScript origins: `http://localhost:3001`
   - Authorized redirect URIs: `https://[tu-proyecto].supabase.co/auth/v1/callback`

### 4. Actualizar Header/Navbar

En tu componente `Header.tsx`:

```tsx
import { UserMenu } from '@/components/UserMenu';

export function Header() {
  return (
    <header>
      {/* ... resto del header ... */}
      <UserMenu />
    </header>
  );
}
```

---

## 📝 Flujos de Usuario

### Flujo 1: Registro Público
```
1. Usuario → /auth/login
2. Click "Continuar con Google"
3. Google OAuth
4. Callback → /auth/callback
5. Backend crea Profile + asigna rol 'player'
6. Redirige a home
7. Usuario ve en UserMenu: "Crear perfil de jugador"
8. Click → /profile/create-player
9. Completa nombre y apellido
10. POST /api/auth/create-player-profile
11. Backend crea Player vinculado a supabaseUserId
12. Usuario puede crear equipos, inscribirse a torneos
```

### Flujo 2: Invitación de Admin (futuro)
```
1. Admin invita usuario con rol específico (referee, admin, etc.)
2. Usuario recibe email
3. Click link → /auth/login
4. Google OAuth
5. Backend crea Profile + asigna rol invitado
6. Usuario NO tiene perfil de jugador
7. Puede realizar funciones de su rol (arbitrar, administrar, etc.)
```

---

## 🔧 Uso de `useAuth()`

### Verificar si está autenticado
```tsx
import { useAuth } from '@/providers/AuthProvider';

function MyComponent() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return <div>Hola {profile?.name}</div>;
}
```

### Verificar si tiene perfil de jugador
```tsx
const { profile } = useAuth();

if (profile?.hasPlayerProfile) {
  // Puede crear equipos, inscribirse a torneos
} else {
  // Mostrar botón "Crear perfil de jugador"
}
```

### Verificar roles
```tsx
const { profile } = useAuth();

if (profile?.roles.includes('admin')) {
  // Mostrar opciones de admin
}

if (profile?.roles.includes('referee')) {
  // Mostrar opciones de árbitro
}
```

### Cerrar sesión
```tsx
const { signOut } = useAuth();

<button onClick={() => signOut()}>
  Cerrar Sesión
</button>
```

---

## 🎨 Response del Profile

Cuando el usuario está autenticado, `profile` contiene:

```typescript
{
  id: string;                    // ID del Profile
  supabaseUserId: string;         // ID de Supabase Auth
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified: boolean;
  documentNumber?: string;
  documentVerified: boolean;
  dateOfBirth?: string;
  roles: string[];                // ['player', 'admin', etc.]
  hasPlayerProfile: boolean;      // true si creó su perfil de jugador
  playerId?: string;              // ID del Player (si existe)
  playerName?: string;            // "John Doe" (si existe)
  createdAt: string;
}
```

---

## ⚠️ Notas Importantes

1. **El backend NO maneja login/register/logout**
   - Todo se hace con Supabase Auth
   - El backend solo valida tokens y sincroniza datos

2. **Profile vs Player**
   - **Profile**: Todos los usuarios (obligatorio)
   - **Player**: Solo quienes quieren jugar (opcional)

3. **Roles**
   - Registro público → automáticamente `player` role
   - Invitación admin → rol específico (admin, referee, etc.)
   - Un usuario puede tener múltiples roles

4. **Token en headers**
   - Automático gracias al interceptor en `baseClient.ts`
   - No necesitas agregar `Authorization` manualmente

---

## 📚 Documentación Completa

Ver `SETUP-AUTH.md` para guía paso a paso con troubleshooting.

---

✅ **Todo listo para comenzar a testear!** 🚀

