# 🚀 Setup Completo - Overtime Frontend

## 📋 Prerrequisitos

- Node.js 22+
- pnpm 10+
- Proyecto en Supabase creado
- Backend de Overtime corriendo

---

## 1️⃣ Instalación

```bash
cd overtime-fe
pnpm install
```

---

## 2️⃣ Variables de Entorno

Crea `.env.local` en la raíz del proyecto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Obtener credenciales de Supabase:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 3️⃣ Configurar Supabase Auth

### A. Habilitar Google OAuth

1. Ve a **Authentication** → **Providers**
2. Habilita **Google**
3. Necesitas credenciales de Google Cloud Console

### B. Configurar Google Cloud Console

1. Ve a https://console.cloud.google.com
2. Crea un proyecto (si no tienes)
3. Habilita **Google+ API**
4. Ve a **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth Client ID**
6. Selecciona **Web application**
7. Configura:

   **Authorized JavaScript origins:**
   ```
   http://localhost:3001
   https://tu-dominio.com
   ```

   **Authorized redirect URIs:**
   ```
   https://[tu-proyecto].supabase.co/auth/v1/callback
   ```

8. Copia **Client ID** y **Client Secret**
9. Pégalos en Supabase (paso A)

### C. Configurar URLs en Supabase

1. Ve a **Authentication** → **URL Configuration**
2. Configura:

   **Site URL:**
   ```
   http://localhost:3001
   ```

   **Redirect URLs:**
   ```
   http://localhost:3001/auth/callback
   http://localhost:3001/**
   ```

   **Para producción:**
   ```
   https://tu-dominio.com/auth/callback
   https://tu-dominio.com/**
   ```

---

## 4️⃣ Configurar Triggers de Supabase

**IMPORTANTE**: Los triggers crean automáticamente el perfil del usuario cuando se registra.

### Instalar triggers:

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Ejecuta el contenido de estos archivos (en orden):

```sql
-- Archivo: overtime-be/prisma/supabase-trigger-create-profile.sql
-- (Copia y pega todo el contenido, luego Run)

-- Archivo: overtime-be/prisma/supabase-trigger-delete-profile.sql
-- (Copia y pega todo el contenido, luego Run)
```

### Verificar instalación:

```sql
-- Verificar que los triggers existen
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users';

-- Deberías ver:
-- on_auth_user_created | users
-- on_auth_user_deleted | users
```

📚 Ver documentación completa en: `overtime-be/prisma/SUPABASE-TRIGGERS-SETUP.md`

---

## 5️⃣ Iniciar el Frontend

```bash
pnpm dev
```

El servidor estará en: http://localhost:3001

---

## 6️⃣ Testing

### Test 1: Login con Google

1. Ve a http://localhost:3001/auth/login
2. Click **Continuar con Google**
3. Selecciona tu cuenta de Google
4. Deberías ser redirigido a home
5. Deberías ver tu nombre y avatar en la esquina superior derecha

### Test 2: Verificar Profile en Backend

```bash
# Obtener token desde DevTools > Application > Cookies
# Busca la cookie sb-[project]-auth-token

curl -H "Authorization: Bearer [tu-token]" \
  http://localhost:3000/api/auth/me
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "supabaseUserId": "uuid...",
    "email": "tu@email.com",
    "name": "Tu Nombre",
    "avatarUrl": "https://...",
    "roles": ["player"],
    "hasPlayerProfile": false
  }
}
```

### Test 3: Crear Perfil de Jugador

1. Estando logueado, ve a http://localhost:3001/profile/create-player
2. Completa nombre y apellido
3. Click **Crear Perfil de Jugador**
4. Deberías ver "⚽ Jugador: [Tu Nombre]" en el menú de usuario

---

## 7️⃣ Integrar UserMenu en el Header

En tu componente `Header.tsx`:

```tsx
import { UserMenu } from '@/components/UserMenu';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      {/* Logo y navegación */}
      <div>Logo</div>
      
      {/* UserMenu en la esquina derecha */}
      <UserMenu />
    </header>
  );
}
```

---

## 🔧 Troubleshooting

### Error: "Invalid redirect URL"

**Solución:**
- Verifica que la URL esté agregada exactamente en Supabase
- Incluye el puerto si es localhost (`:3001`)
- No olvides el protocolo (`http://` o `https://`)

### Error: "Session not found"

**Solución:**
- Verifica que las variables de entorno estén correctas
- Limpia cookies del navegador
- Reinicia el servidor de desarrollo

### Error: "Backend not responding"

**Solución:**
- Verifica que el backend esté corriendo en puerto 3000
- Verifica `NEXT_PUBLIC_API_URL` en `.env.local`
- Verifica CORS en el backend

### Error: "Profile not found"

**Solución:**
- Verifica que los triggers estén instalados en Supabase
- Verifica que el rol `player` exista en la tabla `roles`
- Ejecuta el seed del backend: `cd overtime-be && pnpm prisma:seed`

---

## 📁 Estructura del Proyecto

```
overtime-fe/
├── app/
│   ├── layout.tsx              # Root layout (obtiene session SSR)
│   ├── (page)/
│   │   └── page.tsx            # Home page
│   └── auth/
│       ├── login/page.tsx      # Página de login
│       ├── callback/route.ts   # OAuth callback
│       └── error/page.tsx      # Página de error
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Cliente para Client Components
│   │   └── server.ts           # Cliente para Server Components
│   └── auth/
│       └── session.ts          # Helpers SSR (getUser, getProfile)
├── providers/
│   └── AuthProvider.tsx        # Context de autenticación
├── components/
│   └── UserMenu.tsx            # Menú de usuario
├── modules/
│   └── common/
│       └── client/
│           └── baseClient.ts   # Axios client con auth interceptor
├── middleware.ts               # Middleware de protección de rutas
└── .env.local                  # Variables de entorno (crear)
```

---

## 📚 Documentación Adicional

- **`SETUP-AUTH.md`** - Guía completa de autenticación
- **`README-AUTH.md`** - Resumen de implementación
- **`ARQUITECTURA-AUTH-SSR.md`** - Arquitectura server-side detallada
- **`overtime-be/prisma/SUPABASE-TRIGGERS-SETUP.md`** - Setup de triggers

---

## 🎯 Flujo Completo

```
1. Usuario → /auth/login
2. Click "Continuar con Google"
3. Google OAuth
4. Callback → /auth/callback
5. Supabase crea usuario en auth.users
6. 🔥 TRIGGER: Crea Profile automáticamente + asigna rol 'player'
7. Redirige a home
8. Layout obtiene user + profile (SSR)
9. AuthProvider los distribuye a toda la app
10. useAuth() disponible en todos los componentes
```

---

✅ **¡Todo listo para desarrollar!** 🚀

