# Guías para Frontend (Next.js)

## Estructura de Componentes

### Organización
- Componentes en `modules/[module]/components/`
- Componentes compartidos en `modules/common/components/`
- Un componente por archivo
- Usar PascalCase para nombres de componentes

```
components/
├── UserCard.tsx           # Componente simple
├── UserList.tsx           # Lista de usuarios
└── UserForm/
    ├── index.tsx          # Componente principal
    ├── UserFormFields.tsx # Sub-componente
    └── UserFormValidation.tsx
```

## Componentes React

### Principios
- **Componentes funcionales** con hooks
- Props tipadas con TypeScript
- Separar lógica de presentación
- Componentes pequeños y reutilizables

```typescript
// ✅ Correcto
interface UserCardProps {
  user: User;
  onEdit?: (id: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      {onEdit && (
        <button onClick={() => onEdit(user.id)}>Edit</button>
      )}
    </div>
  );
}
```

### Hooks Personalizados
- Extraer lógica reutilizable a hooks
- Prefijo `use` para nombres de hooks
- Retornar objetos con valores y funciones

```typescript
// ✅ Correcto
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, refetch: fetchUsers };
}
```

## Next.js App Router

### Rutas
- Usar App Router (no Pages Router)
- Grupos de rutas con `(folder)` para layouts
- `page.tsx` para páginas
- `layout.tsx` para layouts
- `loading.tsx` para loading states
- `error.tsx` para error boundaries

```
app/
├── (admin)/
│   ├── layout.tsx        # Layout con sidebar
│   └── tournaments/
│       └── page.tsx      # Página de listado
└── (public)/
    └── tournaments/
        └── [id]/
            └── page.tsx  # Página de detalle
```

### Server Components vs Client Components
- **Server Components por defecto** (mejor performance)
- Usar `'use client'` solo cuando sea necesario:
  - Interactividad (onClick, onChange, etc.)
  - Hooks de React (useState, useEffect, etc.)
  - APIs del navegador

```typescript
// ✅ Server Component (por defecto)
export default async function TournamentPage({ params }: { params: { id: string } }) {
  const tournament = await getTournament(params.id);
  return <TournamentDetails tournament={tournament} />;
}

// ✅ Client Component (cuando se necesita interactividad)
'use client';

export function TournamentForm() {
  const [name, setName] = useState('');
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

## Servicios y API Calls

### Estructura
- Servicios en `modules/[module]/services/`
- Cliente base en `modules/common/client/`
- Usar axios o fetch con tipos

```typescript
// ✅ Correcto
import { client } from '@/modules/common/client/baseClient';
import { Service } from '@/modules/common/services/Service';

class TournamentService extends Service {
  async getTournaments(): Promise<Tournament[]> {
    const { data } = await this.client.get<Tournament[]>('/tournaments');
    return data;
  }

  async createTournament(dto: CreateTournamentDto): Promise<Tournament> {
    const { data } = await this.client.post<Tournament>('/tournaments', dto);
    return data;
  }
}

export default new TournamentService(client);
```

### Manejo de Errores
- Try/catch en funciones async
- Mostrar mensajes amigables al usuario
- Logging de errores para debugging

```typescript
// ✅ Correcto
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    await tournamentService.create(data);
    toast.success('Torneo creado exitosamente');
    router.push('/tournaments');
  } catch (error) {
    console.error('Error creating tournament:', error);
    toast.error('No se pudo crear el torneo');
  } finally {
    setLoading(false);
  }
};
```

## Styling con Tailwind CSS

### Principios
- Usar clases de Tailwind directamente
- Componentes reutilizables para patrones comunes
- Utility `cn()` para combinar clases condicionalmente

```typescript
// ✅ Correcto
import { cn } from '@/utils/cn';

export function Button({ 
  variant = 'primary', 
  className,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
      {...props}
    />
  );
}
```

### Responsive Design
- Mobile-first approach
- Usar breakpoints de Tailwind: `sm:`, `md:`, `lg:`, `xl:`

```typescript
// ✅ Correcto
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

## Formularios

### Validación
- Usar `react-hook-form` para formularios complejos
- Validación con `zod` o `yup`
- Mostrar errores de validación claramente

```typescript
// ✅ Correcto
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

export function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
    </form>
  );
}
```

## Estado Global

### Cuándo Usar
- Estado compartido entre múltiples componentes
- Preferir Context API para estado simple
- Considerar Zustand o Redux para estado complejo

```typescript
// ✅ Context API para estado simple
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Performance

### Optimizaciones
- Usar `next/image` para imágenes
- Lazy loading de componentes pesados
- Memoización cuando sea necesario (`useMemo`, `useCallback`)
- Code splitting automático con Next.js

```typescript
// ✅ Correcto
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false, // Si no necesita SSR
});
```

## Testing

### Componentes
- Tests con React Testing Library
- Tests de integración para flujos completos

```typescript
// ✅ Correcto
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

test('renders user name', () => {
  const user = { id: '1', name: 'John Doe' };
  render(<UserCard user={user} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

