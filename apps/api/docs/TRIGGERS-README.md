# 🔥 Triggers de Supabase - Resumen Ejecutivo

## ✅ ¿Qué se creó?

### 📄 Archivos SQL

1. **`overtime-be/prisma/supabase-trigger-create-profile.sql`**
   - Trigger que se ejecuta cuando un usuario se registra
   - Crea automáticamente un `Profile` en la base de datos
   - Asigna el rol `player` por defecto

2. **`overtime-be/prisma/supabase-trigger-delete-profile.sql`**
   - Trigger que se ejecuta cuando se elimina un usuario
   - Hace soft delete del `Profile` y `Player`

### 📚 Documentación

3. **`overtime-be/prisma/SUPABASE-TRIGGERS-SETUP.md`**
   - Guía completa de instalación y troubleshooting
   - Ejemplos de testing
   - Queries de verificación

4. **`overtime-fe/README-SETUP.md`**
   - Setup completo del frontend paso a paso
   - Configuración de OAuth, variables de entorno
   - Testing end-to-end

5. **`ARQUITECTURA-COMPLETA.md`**
   - Visión general de toda la arquitectura
   - Diagramas y flujos
   - Estructura de carpetas

---

## 🚀 ¿Qué hacer ahora?

### Paso 1: Instalar los Triggers en Supabase

```
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor"
4. Crea un nuevo query
5. Copia y pega el contenido de:
   overtime-be/prisma/supabase-trigger-create-profile.sql
6. Click "Run" (o Ctrl+Enter)
7. Repite para:
   overtime-be/prisma/supabase-trigger-delete-profile.sql
```

### Paso 2: Verificar instalación

```sql
-- Ejecuta esto en SQL Editor
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users';

-- Deberías ver:
-- on_auth_user_created | users
-- on_auth_user_deleted | users
```

### Paso 3: Testear

```
1. Ve a tu frontend: http://localhost:3001/auth/login
2. Haz login con Google
3. Deberías ser redirigido a home
4. Deberías ver tu nombre y avatar
5. El perfil se creó automáticamente ✅
```

---

## 🎯 ¿Qué hace el Trigger?

### Cuando un usuario se registra:

```
Usuario → Google OAuth → Supabase Auth
                              ↓
                    auth.users (INSERT)
                              ↓
                    🔥 TRIGGER: on_auth_user_created
                              ↓
                    function: handle_new_user()
                              ↓
                    ├─► Crea Profile
                    │   - supabaseUserId = user.id
                    │   - email = user.email
                    │   - name = user.metadata.name
                    │   - avatarUrl = user.metadata.avatar_url
                    │
                    └─► Asigna rol 'player'
                        - Crea ProfileRole
                              ↓
                    ✅ Profile listo automáticamente
```

---

## 📝 Ventajas

### ✅ Antes (Sin Trigger)
```typescript
// Backend tenía que crear el perfil manualmente
const profile = await authService.getOrCreateProfile(user, 'public');
```

**Problemas:**
- ❌ El perfil no existía hasta el primer request
- ❌ Podía fallar si el backend no estaba disponible
- ❌ Timing issues

### ✅ Ahora (Con Trigger)
```typescript
// El perfil ya existe, solo lo obtenemos
const profile = await authService.getProfile(user.id);
```

**Ventajas:**
- ✅ Perfil creado instantáneamente al registrarse
- ✅ No depende del backend
- ✅ Atómico con la transacción de registro
- ✅ Consistente siempre

---

## 🔧 Campos del Profile Creado

El trigger crea un `Profile` con:

```typescript
{
  id: 'uuid-generado',
  supabaseUserId: 'id-del-usuario-de-supabase',
  email: 'usuario@gmail.com',
  name: 'Nombre desde Google' || 'email antes del @',
  avatarUrl: 'https://lh3.googleusercontent.com/...',
  phone: null,
  phoneVerified: false,
  documentNumber: null,
  documentVerified: false,
  dateOfBirth: null,
  createdAt: now(),
  updatedAt: now(),
  deletedAt: null,
  
  // Rol asignado automáticamente:
  profileRoles: [
    { roleId: 'player-role-id', assignedAt: now() }
  ]
}
```

---

## ⚠️ Requisitos Previos

Antes de instalar los triggers, asegúrate de que:

- [ ] La tabla `profiles` existe (migración de Prisma ejecutada)
- [ ] La tabla `roles` existe y tiene el rol `player`
- [ ] La tabla `ProfileRole` existe

**Ejecutar:**
```bash
cd overtime-be
pnpm prisma migrate dev
pnpm prisma:seed
```

---

## 🧪 Testing

### Crear usuario de prueba

```bash
# Desde tu frontend
http://localhost:3001/auth/login
# → Login con Google

# O desde Supabase Dashboard
Authentication > Users > Invite User
```

### Verificar que se creó el Profile

```sql
-- En Supabase SQL Editor
SELECT 
  p.id,
  p."supabaseUserId",
  p.email,
  p.name,
  p."avatarUrl",
  array_agg(r.name) as roles
FROM profiles p
LEFT JOIN "ProfileRole" pr ON pr."profileId" = p.id
LEFT JOIN roles r ON r.id = pr."roleId"
WHERE p.email = 'tu-email@gmail.com'
GROUP BY p.id;
```

**Resultado esperado:**
```
id      | supabaseUserId | email              | name       | roles
--------|----------------|--------------------|-----------|---------
uuid... | uuid...        | tu-email@gmail.com | Tu Nombre | {player}
```

---

## 📚 Más Información

- **Setup completo**: `overtime-fe/README-SETUP.md`
- **Triggers detallados**: `overtime-be/prisma/SUPABASE-TRIGGERS-SETUP.md`
- **Arquitectura completa**: `ARQUITECTURA-COMPLETA.md`
- **Auth SSR**: `overtime-fe/ARQUITECTURA-AUTH-SSR.md`

---

## 🎉 Resumen

**Antes:**
```
Usuario se registra → Perfil NO existe → Backend lo crea en primer request
```

**Ahora:**
```
Usuario se registra → 🔥 Trigger lo crea automáticamente → Perfil ya existe ✅
```

---

✅ **¡Instala los triggers y testea!** 🚀

