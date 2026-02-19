# 🔥 Supabase Triggers - Auto-crear Profile

## 📋 ¿Qué hacen estos triggers?

### 1. **`on_auth_user_created`** ✅
- **Cuándo**: Se ejecuta automáticamente cuando un usuario se registra en Supabase Auth
- **Qué hace**:
  1. Crea un registro en la tabla `profiles` con:
     - `supabaseUserId` = ID del usuario de Auth
     - `email` = Email del usuario
     - `name` = Nombre desde Google OAuth (o email si no hay nombre)
     - `avatarUrl` = Avatar desde Google OAuth
  2. Asigna automáticamente el rol **`player`** al nuevo perfil

### 2. **`on_auth_user_deleted`** 🗑️
- **Cuándo**: Se ejecuta cuando un usuario es eliminado de Supabase Auth
- **Qué hace**:
  - Soft delete del `Profile` (marca `deletedAt`)
  - Soft delete del `Player` si existe

---

## 🚀 Instalación

### Opción 1: SQL Editor en Supabase Dashboard

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea un nuevo query
4. Copia y pega el contenido de `supabase-trigger-create-profile.sql`
5. Click en **Run** (o Ctrl+Enter)
6. Repite para `supabase-trigger-delete-profile.sql`

### Opción 2: Supabase CLI

```bash
# Desde el directorio overtime-be/prisma/

# 1. Ejecutar trigger de creación
supabase db push --db-url "postgresql://..." < supabase-trigger-create-profile.sql

# 2. Ejecutar trigger de eliminación
supabase db push --db-url "postgresql://..." < supabase-trigger-delete-profile.sql
```

### Opción 3: psql (PostgreSQL CLI)

```bash
psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  -f supabase-trigger-create-profile.sql

psql "postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres" \
  -f supabase-trigger-delete-profile.sql
```

---

## ✅ Verificación

### 1. Verificar que los triggers existen

```sql
-- Ver triggers activos
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users';
```

**Resultado esperado:**
```
trigger_name          | event_manipulation | event_object_table | action_statement
----------------------|--------------------|--------------------|------------------
on_auth_user_created  | INSERT             | users              | EXECUTE FUNCTION...
on_auth_user_deleted  | DELETE             | users              | EXECUTE FUNCTION...
```

### 2. Verificar las funciones

```sql
-- Ver funciones creadas
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'handle_user_deleted');
```

---

## 🧪 Testing

### Test 1: Crear usuario desde Supabase Auth

```sql
-- 1. Registrar un usuario de prueba desde tu frontend
-- (Login con Google o cualquier proveedor)

-- 2. Verificar que se creó el Profile
SELECT 
  p.id,
  p."supabaseUserId",
  p.email,
  p.name,
  p."avatarUrl",
  p."createdAt",
  array_agg(r.name) as roles
FROM profiles p
LEFT JOIN "ProfileRole" pr ON pr."profileId" = p.id
LEFT JOIN roles r ON r.id = pr."roleId"
WHERE p.email = 'test@example.com'
GROUP BY p.id;
```

**Resultado esperado:**
```
id      | supabaseUserId | email             | name       | roles
--------|----------------|-------------------|------------|--------
uuid... | uuid...        | test@example.com  | Test User  | {player}
```

### Test 2: Eliminar usuario

```sql
-- 1. Eliminar usuario desde Supabase Dashboard (Authentication > Users)

-- 2. Verificar que el Profile se marcó como eliminado
SELECT 
  id,
  email,
  "deletedAt",
  "deletedAt" IS NOT NULL as is_deleted
FROM profiles
WHERE email = 'test@example.com';
```

---

## 🔧 Troubleshooting

### Error: "permission denied for schema auth"

**Causa**: La función necesita permisos para leer `auth.users`

**Solución**: Asegúrate de que la función use `SECURITY DEFINER`:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Error: "relation 'profiles' does not exist"

**Causa**: Las tablas aún no existen

**Solución**: Ejecutar las migraciones de Prisma primero:
```bash
cd overtime-be
pnpm prisma migrate dev
```

### Error: "role 'player' not found"

**Causa**: El rol `player` no existe en la tabla `roles`

**Solución**: Ejecutar el seed de Prisma:
```bash
cd overtime-be
pnpm prisma:seed
```

### El trigger no se ejecuta

**Verificar:**
1. ¿El trigger está activo?
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. ¿La función existe?
   ```sql
   SELECT * FROM information_schema.routines 
   WHERE routine_name = 'handle_new_user';
   ```

3. Ver logs de errores:
   ```sql
   -- En Supabase Dashboard > Database > Logs
   ```

---

## 🔄 Flujo Completo

```
┌─────────────────┐
│ Usuario hace    │
│ login con Google│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Auth   │
│ crea user en    │
│ auth.users      │
└────────┬────────┘
         │
         ▼ TRIGGER: on_auth_user_created
┌─────────────────┐
│ handle_new_user │
│ (función PL/SQL)│
└────────┬────────┘
         │
         ├─► Crea registro en profiles
         │   - supabaseUserId
         │   - email, name, avatarUrl
         │
         └─► Asigna rol 'player'
             - Crea ProfileRole

┌─────────────────┐
│ ✅ Profile listo│
│ automáticamente │
└─────────────────┘
```

---

## 📝 Ventajas de usar Triggers

### ✅ Pros
1. **Automático**: No requiere código en backend
2. **Inmediato**: Se ejecuta al instante del registro
3. **Consistente**: Siempre se ejecuta, no depende del código del backend
4. **Atómico**: Si falla, el registro también falla (transacción)
5. **Centralizado**: Toda la lógica en la base de datos

### ⚠️ Contras
1. **Debugging**: Más difícil de debuggear que código backend
2. **Testing**: Requiere testing directo en la base de datos
3. **Migraciones**: Hay que mantener los triggers actualizados

---

## 🔄 Actualización del Backend

Con los triggers instalados, **el backend ya NO necesita** crear el perfil manualmente.

### Antes (Backend creaba perfil):
```typescript
// ❌ Ya no necesario
const profile = await this.authService.getOrCreateProfile(user, 'public');
```

### Ahora (Trigger lo crea automáticamente):
```typescript
// ✅ Solo obtener perfil (ya existe)
const profile = await this.authService.getProfile(user.id);
```

**Opcional**: Puedes mantener `getOrCreateProfile` como fallback por seguridad.

---

## 📚 Referencias

- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [PostgreSQL Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [Supabase Auth Webhooks](https://supabase.com/docs/guides/auth/auth-hooks)

---

✅ **Profile se crea automáticamente en cada registro!** 🎉

