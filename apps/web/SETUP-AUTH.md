# 🔐 Configuración de Supabase Auth

## 📋 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🔧 Configuración en Supabase

### 1. Ir a tu proyecto en Supabase

`https://supabase.com/dashboard/project/[tu-proyecto]`

### 2. Configurar Google OAuth

1. Ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Agrega las credenciales de Google Cloud:
   - **Client ID**: `[tu-client-id]`
   - **Client Secret**: `[tu-client-secret]`

### 3. Configurar Redirect URLs

1. Ve a **Authentication** → **URL Configuration**
2. Agrega estas URLs:

**Site URL:**
```
http://localhost:3001
```

**Redirect URLs:**
```
http://localhost:3001/auth/callback
http://localhost:3001/**
```

Para producción:
```
https://tu-dominio.com/auth/callback
https://tu-dominio.com/**
```

---

## 🌐 Google Cloud Console

### 1. Crear proyecto (si no existe)

`https://console.cloud.google.com`

### 2. Habilitar Google+ API

1. Ve a **APIs & Services** → **Library**
2. Busca "Google+ API"
3. Habilítala

### 3. Crear credenciales OAuth 2.0

1. Ve a **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth Client ID**
3. Tipo: **Web application**
4. **Authorized JavaScript origins:**
   ```
   http://localhost:3001
   https://tu-dominio.com
   ```
5. **Authorized redirect URIs:**
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   ```

---

## 🚀 Iniciar el Proyecto

```bash
# Instalar dependencias
pnpm install

# Iniciar dev server
pnpm dev
```

El frontend estará en: `http://localhost:3001`

---

## 📝 Flujo de Autenticación

### Registro/Login Público

```
1. Usuario hace click en "Iniciar Sesión"
2. Redirige a /auth/login
3. Usuario hace click en "Continuar con Google"
4. Supabase maneja OAuth con Google
5. Redirige a /auth/callback
6. Backend crea Profile + asigna rol 'player'
7. Usuario es redirigido a la home
```

### Crear Perfil de Jugador

```
1. Usuario logueado sin perfil de jugador
2. Ve botón "Crear perfil de jugador"
3. Click → redirige a /profile/create-player
4. Completa nombre y apellido
5. POST /api/auth/create-player-profile
6. Backend crea Player vinculado a supabaseUserId
7. Usuario puede crear equipos, inscribirse a torneos
```

---

## 🎨 Componentes Creados

### `<UserMenu />` 

Menú de usuario con:
- Avatar/Inicial
- Nombre y email
- Estado de perfil de jugador
- Botón "Crear perfil de jugador" (si no tiene)
- Links a equipos, perfil, admin (según roles)
- Cerrar sesión

**Uso:**
```tsx
import { UserMenu } from '@/components/UserMenu';

<Header>
  <UserMenu />
</Header>
```

### `useAuth()` Hook

Hook para acceder al estado de autenticación:

```tsx
import { useAuth } from '@/providers/AuthProvider';

function MyComponent() {
  const {
    user,           // User de Supabase
    profile,        // Profile del backend
    session,        // Session de Supabase
    loading,        // Boolean
    signInWithGoogle,
    signOut,
    refreshProfile, // Refrescar profile desde backend
  } = useAuth();

  // Verificar si tiene perfil de jugador
  if (profile?.hasPlayerProfile) {
    // Usuario puede jugar
  }

  // Verificar roles
  if (profile?.roles.includes('admin')) {
    // Usuario es admin
  }
}
```

---

## 🔒 Rutas Protegidas

El middleware automáticamente protege estas rutas:

- `/admin/*` - Solo usuarios autenticados
- `/profile/*` - Solo usuarios autenticados
- `/teams/create` - Solo usuarios autenticados

Si un usuario no autenticado intenta acceder, será redirigido a `/auth/login`.

---

## 🎯 Response del Profile (GET /api/auth/me)

```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "supabaseUserId": "supabase-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "roles": ["player"],
    "hasPlayerProfile": true,
    "playerId": "player-uuid",
    "playerName": "John Doe"
  }
}
```

---

## ✅ Testing

### 1. Login con Google

1. Ir a `http://localhost:3001/auth/login`
2. Click "Continuar con Google"
3. Seleccionar cuenta de Google
4. Debería redirigir a home
5. Ver nombre y avatar en esquina superior derecha

### 2. Crear Perfil de Jugador

1. Login exitoso
2. Click en avatar → "Crear perfil de jugador"
3. Completar nombre y apellido
4. Submit
5. Debería ver "⚽ Jugador: [Nombre]" en el menú

### 3. Verificar en Backend

```bash
# En terminal del backend
curl -H "Authorization: Bearer [token]" http://localhost:3000/api/auth/me
```

---

## 🐛 Troubleshooting

### Error: "Invalid redirect URL"

- Verifica que la URL esté agregada en Supabase
- Verifica que el dominio coincida exactamente
- Incluye el puerto si es localhost

### Error: "Session not found"

- Verifica que `NEXT_PUBLIC_SUPABASE_URL` esté correcta
- Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` esté correcta
- Limpia cookies del navegador

### Error: "Backend not responding"

- Verifica que el backend esté corriendo en puerto 3000
- Verifica que `NEXT_PUBLIC_API_URL` esté correcta
- Verifica CORS en el backend

---

## 📚 Documentación

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js App Router + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)

