# 🔐 Arquitectura de Autenticación Server-Side

## 🎯 Enfoque: Session Server-Side

La autenticación en Overtime está diseñada para **manejar la sesión completamente server-side** mediante cookies, siguiendo las mejores prácticas de Next.js 15+ y Supabase SSR.

---

## 🏗️ Arquitectura

### 1. **Session Server-Side** ✅

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Request (with cookies)
       ▼
┌─────────────────────┐
│  Next.js Middleware │ ← Lee cookies, valida session
└──────┬──────────────┘
       │
       ▼
┌──────────────────────┐
│  Server Components   │ ← Obtiene user + profile server-side
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   AuthProvider       │ ← Recibe datos del servidor como props
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Client Components   │ ← useAuth() para acceder a datos
└──────────────────────┘
```

---

## 📁 Estructura de Archivos

### **Server-Side** (SSR)

```
lib/
├── supabase/
│   ├── client.ts      ← Cliente para Client Components (auth mutations)
│   └── server.ts      ← Cliente para Server Components (read session)
└── auth/
    └── session.ts     ← Helpers: getUser(), getProfile()

middleware.ts          ← Protección de rutas + refresh token
```

### **Client-Side**

```
providers/
└── AuthProvider.tsx   ← Context que recibe datos SSR

components/
└── UserMenu.tsx       ← Usa useAuth()

app/
├── layout.tsx         ← Server Component que obtiene session
└── auth/
    ├── login/page.tsx       ← Client Component (signInWithGoogle)
    └── callback/route.ts    ← Route Handler (exchangeCodeForSession)
```

---

## 🔑 Flujo de Autenticación

### 1. **Login con Google**

```
1. Usuario → /auth/login (Client Component)
2. Click "Continuar con Google"
3. supabase.auth.signInWithOAuth({ provider: 'google' })
4. Redirige a Google OAuth
5. Google callback → /auth/callback
6. Route Handler: exchangeCodeForSession() → Sets cookies
7. Redirige a home
8. Middleware: Lee cookies, valida session
9. Layout (Server Component): getUser() + getProfile()
10. AuthProvider recibe datos como props
11. useAuth() disponible en toda la app
```

### 2. **Logout**

```
1. Usuario → Click "Cerrar Sesión"
2. useAuth().signOut() (Client Component)
3. supabase.auth.signOut() → Borra cookies
4. onAuthStateChange detecta 'SIGNED_OUT'
5. router.refresh() → Recarga datos del servidor
6. Layout obtiene user = null
7. AuthProvider actualizado con null
```

### 3. **Refresh Automático**

```
1. Middleware: Cada request verifica session
2. Si token expiró, Supabase lo refresca automáticamente
3. Cookies actualizadas transparentemente
4. No requiere intervención del cliente
```

---

## 📝 Archivos Clave

### **`lib/auth/session.ts`** (Server-Side)

```typescript
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const session = await getSession();
  if (!session?.access_token) return null;

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  return response.ok ? (await response.json()).data : null;
}
```

**Uso:**
- ✅ Server Components
- ✅ Route Handlers
- ✅ Middleware
- ❌ Client Components (usar `useAuth()`)

---

### **`app/layout.tsx`** (Server Component)

```typescript
export default async function RootLayout({ children }) {
  // Obtener datos server-side (antes de renderizar)
  const user = await getUser();
  const profile = user ? await getProfile() : null;

  return (
    <html>
      <body>
        <AuthProvider serverUser={user} serverProfile={profile}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Ventajas:**
- ✅ Session server-side (seguro)
- ✅ No flash de "loading" en el cliente
- ✅ SEO-friendly
- ✅ Props serializables

---

### **`providers/AuthProvider.tsx`** (Client Component)

```typescript
export function AuthProvider({ children, serverUser, serverProfile }) {
  const user = serverUser;      // Directo del servidor
  const profile = serverProfile;  // Directo del servidor

  // Escuchar cambios de auth (login/logout)
  useEffect(() => {
    const { subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh(); // Refrescar datos del servidor
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, ... }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Responsabilidades:**
- ✅ Propagar datos del servidor a toda la app
- ✅ Escuchar cambios de auth (login/logout)
- ✅ Refrescar datos del servidor cuando cambia auth
- ❌ **NO** maneja estado local de session
- ❌ **NO** hace fetch client-side de profile

---

### **`middleware.ts`**

```typescript
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(..., {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookies) { /* Actualizar cookies */ }
    }
  });

  // Refrescar token automáticamente
  const { data: { user } } = await supabase.auth.getUser();

  // Proteger rutas
  if (isProtectedPath && !user) {
    return redirect('/auth/login');
  }

  return response;
}
```

**Responsabilidades:**
- ✅ Validar session en cada request
- ✅ Refrescar token automáticamente
- ✅ Proteger rutas (redirect si no autenticado)
- ✅ Actualizar cookies server-side

---

## 🎨 Uso en Componentes

### **Server Component**

```typescript
// app/profile/page.tsx
export default async function ProfilePage() {
  const user = await getUser();
  const profile = await getProfile();

  if (!profile) {
    redirect('/auth/login');
  }

  return <div>Hola {profile.name}</div>;
}
```

### **Client Component**

```typescript
'use client';
import { useAuth } from '@/providers/AuthProvider';

export function MyComponent() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;

  return (
    <div>
      <p>Hola {profile?.name}</p>
      <button onClick={signOut}>Cerrar Sesión</button>
    </div>
  );
}
```

---

## ⚡ Ventajas de Server-Side Session

### 1. **Seguridad**
- ✅ Cookies HttpOnly (no accesibles desde JS)
- ✅ Session token nunca expuesto al cliente
- ✅ CSRF protection built-in

### 2. **Performance**
- ✅ No loading state en el cliente (datos ya disponibles)
- ✅ Menos requests al backend
- ✅ SEO-friendly (contenido renderizado server-side)

### 3. **Developer Experience**
- ✅ Una sola fuente de verdad (servidor)
- ✅ No sincronización de estado cliente-servidor
- ✅ Menos bugs relacionados a timing

### 4. **UX**
- ✅ No flash de "Cargando..." en cada página
- ✅ Redirect instantáneo si no autenticado
- ✅ Datos siempre frescos del servidor

---

## 🚀 Mejores Prácticas

### ✅ DO

- **Server Components**: Usar `getUser()` y `getProfile()`
- **Client Components**: Usar `useAuth()`
- **Mutations**: Usar `supabase.auth` (client) + `router.refresh()`
- **Protected Pages**: Verificar auth en Server Component
- **Refresh**: Llamar `router.refresh()` después de mutations

### ❌ DON'T

- ❌ No hacer fetch de profile client-side (usar datos del servidor)
- ❌ No mantener estado local de session (usar props del servidor)
- ❌ No usar `localStorage` para tokens (usar cookies)
- ❌ No exponer tokens al cliente (dejar que Supabase maneje)

---

## 🔄 Comparación: Client-Side vs Server-Side

| Aspecto | Client-Side | Server-Side (✅ Nuestra elección) |
|---------|-------------|----------------------------------|
| **Session Storage** | localStorage / state | Cookies (HttpOnly) |
| **Token Exposure** | ⚠️ Expuesto al cliente | ✅ Solo server-side |
| **Initial Load** | ⚠️ Loading state | ✅ Ya tiene datos |
| **SEO** | ❌ Sin contenido | ✅ Pre-renderizado |
| **Security** | ⚠️ XSS vulnerable | ✅ CSRF + HttpOnly |
| **Complexity** | Media | Baja (Next.js lo maneja) |

---

## 📚 Referencias

- [Supabase Auth + Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js 15 Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/overview)

---

✅ **Session completamente server-side con Cookies HttpOnly** 🔒

