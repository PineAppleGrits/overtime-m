# 🎯 Nueva Arquitectura: Profile + Player (Mejorada)

## 📋 Resumen de Cambios

### ❌ Modelo Anterior
```
User (tabla local) → Player (opcional)
```
- Duplicación de datos entre Supabase Auth y tabla User
- Confusión entre usuario y jugador
- Todos los usuarios tenían rol 'player' por defecto

### ✅ Nuevo Modelo (IMPLEMENTADO)
```
Supabase Auth → Profile (siempre, obligatorio)
                   ↓
              ProfileRoles (múltiples roles)
                   ↓
Supabase Auth → Player (opcional, cuando el usuario quiera)
```
- **Profile**: Info básica de CUALQUIER usuario (obligatorio)
- **Player**: Perfil de jugador (opcional, vinculado a Supabase User)
- **Flexibilidad**: Cualquier usuario puede crear su perfil de jugador
- **Roles múltiples**: Un árbitro PUEDE ser jugador también

---

## 🏗️ Estructura de Datos

### Profile (reemplaza User)
```prisma
model Profile {
  id                 String    @id @default(uuid())
  supabaseUserId     String    @unique  // ← ID de Supabase Auth
  email              String    @unique
  name               String
  phone              String?
  phoneVerified      Boolean
  documentNumber     String?
  documentVerified   Boolean
  dateOfBirth        DateTime?
  avatarUrl          String?
  
  // Relaciones
  player            Player?              // ← Opcional!
  profileRoles      ProfileRole[]
  teamsCreated      Team[]
  // ... otras relaciones
}
```

### Player (solo jugadores)
```prisma
model Player {
  id             String    @id @default(uuid())
  profileId      String    @unique  // ← Vinculado a Profile
  profile        Profile   @relation(...)
  firstName      String
  lastName       String
  jerseyNumber   Int?
  position       String?
  height         Float?
  weight         Float?
  photoUrl       String?
  
  teams          PlayerTeam[]
  captainOf      Team[]
}
```

---

## 🔄 Flujos de Registro

### 1. Flujo Público (Registro Normal)

```
Usuario → Google OAuth (Supabase) → Primera vez?
                                        ↓ SÍ
                                Profile + Player + Rol 'player'
                                        ↓ NO
                                Profile existente
```

**Implementación:**
```typescript
// AuthGuard llama a:
await authService.getOrCreateProfile(supabaseUser, 'public');

// AuthService hace:
1. Buscar Profile por supabaseUserId
2. Si NO existe:
   - Crear Profile
   - Crear Player (automático)
   - Asignar rol 'player'
3. Retornar Profile completo
```

### 2. Flujo de Invitación (Admin)

```
Admin invita → Email con link → Google OAuth → Primera vez?
                                                  ↓ SÍ
                                              Profile (SIN Player)
                                                  ↓
                                              Admin asigna rol
```

**Implementación:**
```typescript
// Endpoint especial de invitación:
POST /api/admin/invite
{
  email: "arbitro@example.com",
  role: "referee"
}

// Cuando el invitado se loguea:
await authService.getOrCreateProfile(supabaseUser, 'invited');

// AuthService hace:
1. Crear Profile
2. NO crear Player
3. Esperar asignación de rol por admin
```

---

## 🎭 Roles

| Rol | Tiene Player? | Cómo se asigna |
|-----|---------------|----------------|
| **player** | ✅ SÍ | Automático en registro público |
| **admin** | ❌ NO | Por invitación |
| **referee** | ❌ NO | Por invitación |
| **table_official** | ❌ NO | Por invitación |
| **photographer** | ❌ NO | Por invitación |

---

## 📝 Cambios en el Código

### 1. AuthService

```typescript
// ANTES
async getOrCreateUser(supabaseUser: any) {
  // Creaba User siempre con rol 'player'
}

// AHORA
async getOrCreateProfile(
  supabaseUser: any,
  registrationType: 'public' | 'invited' = 'public'
) {
  // Si 'public': Profile + Player + rol 'player'
  // Si 'invited': Solo Profile (sin Player)
}
```

### 2. AuthGuard

```typescript
// Siempre usa flujo 'public' por defecto
const profile = await authService.getOrCreateProfile(supabaseUser, 'public');
request.user = profile; // Profile completo con isPlayer, playerId, roles
```

### 3. Nuevos Endpoints (Admin)

```typescript
// Invitar usuario con rol específico
POST /api/admin/invite
{
  email: string,
  role: 'admin' | 'referee' | 'table_official' | 'photographer'
}

// Asignar rol a perfil existente
POST /api/admin/profiles/:id/roles
{
  roleId: string
}

// Crear Player para un Profile (si admin decide después)
POST /api/admin/profiles/:id/player
{
  firstName: string,
  lastName: string,
  ...
}
```

---

## 🔍 Verificación de Permisos

### CurrentUser Decorator

```typescript
// request.user ahora tiene:
{
  id: string,                // Profile ID
  supabaseUserId: string,
  email: string,
  name: string,
  roles: string[],           // ['player'] o ['admin', 'referee']
  isPlayer: boolean,         // true si tiene Player asociado
  playerId: string | null,   // ID del Player si existe
}
```

### Ejemplo de uso

```typescript
@Controller('teams')
export class TeamsController {
  
  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateTeamDto
  ) {
    // Verificar que sea jugador
    if (!user.isPlayer) {
      throw new ForbiddenException('Only players can create teams');
    }
    
    // Usar playerId para vincular
    return this.teamsService.create(dto, user.playerId);
  }
}
```

---

## 🗄️ Migración de Datos

### Script de Migración

```sql
-- 1. Crear tabla profiles desde users
INSERT INTO profiles (
  id, supabase_user_id, email, name, phone, 
  phone_verified, document_number, document_verified,
  avatar_url, created_at, updated_at
)
SELECT 
  id, supabase_auth_id, email, name, phone,
  phone_verified, document_number, document_verified,
  avatar_url, created_at, updated_at
FROM users
WHERE deleted_at IS NULL;

-- 2. Actualizar players para usar profileId
UPDATE players 
SET profile_id = user_id
WHERE user_id IS NOT NULL;

-- 3. Migrar user_roles a profile_roles
INSERT INTO profile_roles (profile_id, role_id, assigned_at)
SELECT user_id, role_id, assigned_at
FROM user_roles;

-- 4. Actualizar referencias en otras tablas
-- (teams, registrations, payments, messages, etc.)
```

---

## ✅ Ventajas de la Nueva Arquitectura

1. **✅ Separación clara**: Profile ≠ Player
2. **✅ Fuente única de verdad**: Supabase Auth es la única fuente de usuarios
3. **✅ Flexibilidad**: No todos los usuarios son jugadores
4. **✅ Flujos diferenciados**: Público vs Invitación
5. **✅ Menos duplicación**: No duplicar datos de Supabase
6. **✅ Más escalable**: Fácil agregar nuevos roles sin Player

---

## 📋 Checklist de Implementación

### Backend

- [x] Crear nuevo schema con Profile
- [x] Actualizar AuthService con dos flujos
- [ ] Reemplazar schema actual
- [ ] Regenerar Prisma client
- [ ] Actualizar todos los servicios (Teams, Players, etc.)
- [ ] Actualizar todos los controladores
- [ ] Crear endpoints de admin para invitaciones
- [ ] Crear migración de datos
- [ ] Tests

### Frontend (Next.js)

- [ ] Actualizar flujo de registro público
- [ ] Crear página de completar perfil de jugador
- [ ] Admin: Crear panel de invitaciones
- [ ] Admin: Gestión de roles
- [ ] Actualizar llamadas a API

---

## 🚀 Siguiente Paso

1. **Revisar** este documento con el equipo
2. **Aprobar** los cambios propuestos
3. **Crear backup** de la base de datos
4. **Aplicar** migración
5. **Actualizar** código backend
6. **Actualizar** código frontend
7. **Probar** ambos flujos

---

¿Aprobamos esta arquitectura?

