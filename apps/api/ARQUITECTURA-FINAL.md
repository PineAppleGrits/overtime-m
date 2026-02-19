# 🎯 Arquitectura Final: Profile + Player

## 📊 Modelo Implementado

```
┌──────────────────┐
│  Supabase Auth   │ ← Fuente única de autenticación
│   (Google OAuth) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│     Profile      │ ← SIEMPRE se crea (obligatorio)
│   (Info básica)  │
└────────┬─────────┘
         │
         ├──→ ProfileRoles (múltiples roles posibles)
         │
         └──→ Player (OPCIONAL, creado cuando el usuario quiera)
```

---

## 🔄 Flujos Implementados

### 1. Registro Público (Web)

```
Usuario → Google OAuth → Supabase Auth
                            ↓
                   ¿Primera vez en DB?
                            ↓ SÍ
                   Profile + Rol 'player'
                            ↓
                  [Usuario decide cuándo]
                            ↓
             [Botón: "Crear perfil de jugador"]
                            ↓
              POST /api/auth/create-player-profile
                  {firstName, lastName}
                            ↓
                       Player creado
```

**Características:**
- ✅ Profile se crea automáticamente
- ✅ Rol 'player' asignado por defecto
- ✅ Player NO se crea automáticamente
- ✅ Usuario elige cuándo crear su perfil de jugador

### 2. Invitación Admin (Staff)

```
Admin invita usuario (email + rol)
                ↓
        Email con invitación
                ↓
Usuario → Google OAuth → Supabase Auth
                            ↓
                   ¿Primera vez en DB?
                            ↓ SÍ
            Profile + Rol asignado por admin
            (referee/table_official/photographer/admin)
                            ↓
                  [Usuario decide cuándo]
                            ↓
              "También quiero jugar?"
                            ↓
             [Botón: "Crear perfil de jugador"]
                            ↓
              Player creado + Rol 'player' agregado
```

**Características:**
- ✅ Profile se crea automáticamente
- ✅ Rol específico asignado por admin
- ✅ Usuario PUEDE crear perfil de jugador después
- ✅ Puede tener múltiples roles (ej: referee + player)

---

## 📝 Modelos de Datos

### Profile (Obligatorio para todos)

```prisma
model Profile {
  id                 String    @id @default(uuid())
  supabaseUserId     String    @unique  // ← Vinculado a Supabase Auth
  email              String    @unique
  name               String
  phone              String?
  phoneVerified      Boolean
  documentNumber     String?
  documentVerified   Boolean
  dateOfBirth        DateTime?
  avatarUrl          String?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  profileRoles      ProfileRole[]  // Múltiples roles
  teamsCreated      Team[]
  // ... otras relaciones
}
```

### Player (Opcional, vinculado a Supabase User)

```prisma
model Player {
  id             String    @id @default(uuid())
  supabaseUserId String    @unique  // ← Directo a Supabase Auth
  firstName      String
  lastName       String
  jerseyNumber   Int?
  position       String?
  height         Float?
  weight         Float?
  photoUrl       String?
  createdAt      DateTime  @default(now())
  
  teams         PlayerTeam[]
  captainOf     Team[]
}
```

**¿Por qué Player vinculado a Supabase y no a Profile?**
- ✅ Más flexible: Cualquier usuario puede ser jugador
- ✅ Independiente: Player es una "capacidad" adicional
- ✅ Simplicidad: No necesita relación intermedia
- ✅ Escalabilidad: Fácil agregar otros perfiles (Coach, Manager, etc.)

---

## 🎭 Roles y Permisos

### Roles Disponibles

| Rol | Asignación | Puede tener Player? |
|-----|------------|---------------------|
| **player** | Auto (registro público) | ✅ SÍ (recomendado) |
| **admin** | Invitación | ✅ SÍ (opcional) |
| **referee** | Invitación | ✅ SÍ (opcional) |
| **table_official** | Invitación | ✅ SÍ (opcional) |
| **photographer** | Invitación | ✅ SÍ (opcional) |

### Ejemplos de Combinaciones

```
Usuario A:
- Profile ✓
- Roles: ['player']
- Player: ✓
→ Jugador normal

Usuario B:
- Profile ✓
- Roles: ['referee']
- Player: ✗
→ Solo árbitro

Usuario C:
- Profile ✓
- Roles: ['referee', 'player']
- Player: ✓
→ Árbitro que también juega

Usuario D:
- Profile ✓
- Roles: ['admin', 'player']
- Player: ✓
→ Admin que también juega
```

---

## 🔌 Endpoints Implementados

### Autenticación

#### `GET /api/auth/me`
Obtiene el perfil del usuario actual

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "profile-uuid",
    "supabaseUserId": "supabase-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["player"],
    "hasPlayerProfile": true,
    "playerId": "player-uuid",
    "playerName": "John Doe"
  }
}
```

#### `POST /api/auth/create-player-profile`
Crea perfil de jugador para el usuario actual

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Player profile created successfully",
  "data": {
    "id": "player-uuid",
    "supabaseUserId": "supabase-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2026-01-13T..."
  }
}
```

**Validaciones:**
- ✅ Usuario debe estar autenticado
- ✅ No puede tener Player ya creado
- ✅ Automáticamente agrega rol 'player' si no lo tiene

---

## 💡 Casos de Uso

### Caso 1: Usuario Nuevo (Registro Web)

```
1. Usuario hace login con Google
2. AuthGuard crea Profile automáticamente + rol 'player'
3. Usuario ve dashboard
4. Usuario hace click en "Crear perfil de jugador"
5. POST /api/auth/create-player-profile {firstName, lastName}
6. Player creado
7. Usuario puede crear equipos, inscribirse a torneos
```

### Caso 2: Admin Invita Árbitro

```
1. Admin invita: POST /api/admin/invite {email, role: 'referee'}
2. Árbitro recibe email
3. Árbitro hace login con Google
4. AuthGuard crea Profile + rol 'referee'
5. Árbitro ve panel de árbitro
6. [OPCIONAL] Árbitro decide: "También quiero jugar"
7. Árbitro hace click en "Crear perfil de jugador"
8. POST /api/auth/create-player-profile
9. Player creado + rol 'player' agregado
10. Árbitro puede arbitrar Y jugar
```

### Caso 3: Admin que También Juega

```
1. Admin ya existe con rol 'admin'
2. Admin hace click en "Crear perfil de jugador"
3. POST /api/auth/create-player-profile
4. Player creado + rol 'player' agregado
5. Admin tiene roles: ['admin', 'player']
6. Admin puede gestionar torneos Y jugar
```

---

## 🎨 UI/UX Sugerida

### Dashboard - Sin Perfil de Jugador

```
┌─────────────────────────────────────┐
│  👤 Bienvenido, John Doe            │
│  📧 john@example.com                │
│  🏷️  Roles: player                  │
├─────────────────────────────────────┤
│                                     │
│  ⚽ ¿Quieres jugar torneos?         │
│                                     │
│  [Crear mi perfil de jugador] ←──  │
│                                     │
└─────────────────────────────────────┘
```

### Dashboard - Con Perfil de Jugador

```
┌─────────────────────────────────────┐
│  👤 Bienvenido, John Doe            │
│  📧 john@example.com                │
│  🏷️  Roles: player                  │
│  ⚽ Jugador: John Doe (#10)         │
├─────────────────────────────────────┤
│  [Mis Equipos]  [Inscribirme]      │
│  [Mis Partidos] [Estadísticas]     │
└─────────────────────────────────────┘
```

---

## ✅ Ventajas de Esta Arquitectura

1. **✅ Flexibilidad Total**
   - Cualquier usuario puede ser jugador
   - Roles múltiples sin restricciones

2. **✅ Separación Clara**
   - Profile = Cuenta básica
   - Player = Capacidad de jugar
   - Roles = Permisos y funciones

3. **✅ Sin Duplicación**
   - Supabase Auth es la fuente única de autenticación
   - Profile solo guarda info adicional
   - Player solo para quien lo necesite

4. **✅ Experiencia de Usuario**
   - Usuario decide cuándo ser jugador
   - No se fuerza a nadie a tener perfil de jugador
   - Staff puede jugar si quiere

5. **✅ Escalabilidad**
   - Fácil agregar nuevos perfiles (Coach, Manager, etc.)
   - Fácil agregar nuevos roles
   - Fácil agregar nuevas capacidades

---

## 🚀 Implementación Completada

### Backend ✅
- [x] Schema con Profile y Player
- [x] AuthService con gestión de Profile
- [x] Endpoint para crear perfil de jugador
- [x] PlayersService actualizado
- [x] Todos los servicios compatibles
- [x] Compilación exitosa

### Frontend (Por Hacer)
- [ ] Botón "Crear perfil de jugador"
- [ ] Verificar `hasPlayerProfile` en dashboard
- [ ] Flujo de creación de perfil
- [ ] UI para mostrar roles múltiples

---

¿Aprobada la arquitectura? ✅

