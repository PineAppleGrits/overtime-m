# Guías para Testing

## Principios

### Pirámide de Testing
- **Unit Tests** (base) - Más tests, más rápidos
- **Integration Tests** (medio) - Menos tests, más lentos
- **E2E Tests** (punta) - Pocos tests, más lentos

### Cobertura Objetivo
- **Mínimo:** 70% de cobertura
- **Ideal:** 80-90% para lógica crítica
- **No obsesionarse:** 100% no es necesario

## Unit Tests

### Backend (NestJS)

#### Servicios
```typescript
// ✅ Correcto
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { name: 'Test', email: 'test@test.com' };
      const expected = { id: '1', ...dto };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(expected);

      const result = await service.create(dto);

      expect(result).toEqual(expected);
      expect(prisma.user.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw ConflictException if email exists', async () => {
      const dto = { name: 'Test', email: 'existing@test.com' };
      
      jest.spyOn(service, 'isEmailTaken').mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });
});
```

#### Controladores
```typescript
// ✅ Correcto
describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should return array of users', async () => {
    const expected = [{ id: '1', name: 'Test' }];
    jest.spyOn(service, 'findAll').mockResolvedValue(expected);

    const result = await controller.findAll({});

    expect(result).toEqual(expected);
    expect(service.findAll).toHaveBeenCalled();
  });
});
```

### Frontend (React/Next.js)

#### Componentes
```typescript
// ✅ Correcto
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@test.com',
  };

  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(onEdit).toHaveBeenCalledWith('1');
  });
});
```

#### Hooks
```typescript
// ✅ Correcto
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from './useUsers';

describe('useUsers', () => {
  it('fetches users on mount', async () => {
    const { result } = renderHook(() => useUsers());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.users).toHaveLength(0);
  });
});
```

## Integration Tests

### Backend
```typescript
// ✅ Correcto
describe('Tournaments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Limpiar base de datos de test
    await prisma.tournament.deleteMany();
  });

  it('/tournaments (POST)', () => {
    return request(app.getHttpServer())
      .post('/tournaments')
      .send({ name: 'Test Tournament' })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('Test Tournament');
      });
  });
});
```

## E2E Tests

### Flujos Completos
```typescript
// ✅ Correcto
describe('Tournament Registration Flow', () => {
  it('should complete full registration process', async () => {
    // 1. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@test.com', password: 'password' });
    
    const token = loginResponse.body.token;

    // 2. Create team
    const teamResponse = await request(app.getHttpServer())
      .post('/teams')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Team' });

    // 3. Register to tournament
    const registrationResponse = await request(app.getHttpServer())
      .post('/registrations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        teamId: teamResponse.body.data.id,
        tournamentId: 'tournament-id',
        categoryId: 'category-id',
      });

    expect(registrationResponse.status).toBe(201);
  });
});
```

## Mocks y Stubs

### Cuándo Usar
- **Mocks:** Para dependencias externas (APIs, servicios)
- **Stubs:** Para datos de prueba
- **Spies:** Para verificar llamadas

```typescript
// ✅ Correcto
jest.mock('@/services/payment.service', () => ({
  PaymentService: {
    processPayment: jest.fn().mockResolvedValue({ success: true }),
  },
}));
```

## Test Data

### Factories
```typescript
// ✅ Correcto
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: '1',
    name: 'Test User',
    email: 'test@test.com',
    ...overrides,
  };
}

// Uso
const user = createMockUser({ name: 'Custom Name' });
```

## Naming Conventions

### Estructura
```
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition', () => {
      // ...
    });
  });
});
```

### Ejemplos
```typescript
describe('UsersService', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {});
    it('should throw error when email exists', () => {});
    it('should hash password before saving', () => {});
  });
});
```

## Best Practices

### DO
- ✅ Testear comportamiento, no implementación
- ✅ Un test = una aserción principal
- ✅ Tests independientes (no dependencias entre tests)
- ✅ Nombres descriptivos
- ✅ Arrange-Act-Assert pattern

### DON'T
- ❌ Tests que dependen de otros tests
- ❌ Tests que prueban múltiples cosas
- ❌ Mocks innecesarios
- ❌ Tests que no fallan cuando deberían
- ❌ Tests lentos sin razón

## Coverage

### Configuración
```json
// package.json
{
  "scripts": {
    "test:cov": "jest --coverage",
    "test:cov:watch": "jest --coverage --watch"
  }
}
```

### Ignorar Archivos
```typescript
// coverageIgnorePatterns en jest.config
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/dist/',
  '\.spec\.ts$',
]
```

