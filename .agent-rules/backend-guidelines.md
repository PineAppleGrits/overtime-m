# Guías para Backend (NestJS)

## Estructura de Módulos

Cada módulo debe seguir esta estructura:

```
module-name/
├── module-name.module.ts      # Módulo NestJS
├── module-name.controller.ts  # Controlador (endpoints)
├── module-name.service.ts     # Lógica de negocio
├── module-name.repository.ts # Acceso a datos (si es necesario)
├── dto/                       # Data Transfer Objects
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/                  # Entidades (si no usamos Prisma directamente)
│   └── module.entity.ts
└── __tests__/                 # Tests
    └── module-name.service.spec.ts
```

## Controladores

### Principios
- **Solo routing y validación básica**
- Lógica de negocio en servicios
- Usar DTOs para validación
- Decoradores apropiados de NestJS

```typescript
// ✅ Correcto
@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin')
  async findAll(@Query() query: PaginationDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Roles('admin')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
```

### Decoradores Comunes
- `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- `@Body()` para request body
- `@Param()` para parámetros de ruta
- `@Query()` para query parameters
- `@UseGuards()` para autenticación/autorización
- `@Roles()` para control de roles

## Servicios

### Principios
- **Toda la lógica de negocio aquí**
- Inyectar dependencias vía constructor
- Usar `@Injectable()` decorator
- Retornar tipos explícitos

```typescript
// ✅ Correcto
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Validaciones de negocio
    await this.validateUserCreation(createUserDto);
    
    // Lógica de creación
    return this.prisma.user.create({
      data: createUserDto,
    });
  }

  private async validateUserCreation(dto: CreateUserDto): Promise<void> {
    // Validaciones específicas del negocio
  }
}
```

## Principios SOLID

Los principios SOLID son fundamentales para mantener código limpio, mantenible y escalable. Aplicarlos correctamente en NestJS.

### S - Single Responsibility Principle (SRP)

**Una clase debe tener una sola razón para cambiar.**

Cada servicio debe tener una única responsabilidad. Si un servicio hace demasiadas cosas, dividirlo en múltiples servicios.

```typescript
// ❌ Incorrecto - Múltiples responsabilidades
@Injectable()
export class UserService {
  async createUser(dto: CreateUserDto) { /* ... */ }
  async sendEmail(user: User) { /* ... */ }
  async generateReport() { /* ... */ }
  async validateDocument(doc: string) { /* ... */ }
}

// ✅ Correcto - Responsabilidad única
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly documentService: DocumentService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    await this.documentService.validate(dto.document);
    const user = await this.userRepository.create(dto);
    await this.emailService.sendWelcomeEmail(user);
    return user;
  }
}

@Injectable()
export class EmailService {
  async sendWelcomeEmail(user: User) { /* ... */ }
}

@Injectable()
export class DocumentService {
  async validate(document: string) { /* ... */ }
}
```

### O - Open/Closed Principle (OCP)

**Las entidades deben estar abiertas para extensión pero cerradas para modificación.**

Usar interfaces y abstracciones para permitir extensión sin modificar código existente.

```typescript
// ✅ Correcto - Abierto para extensión
interface PaymentProvider {
  processPayment(amount: number, data: PaymentData): Promise<PaymentResult>;
}

@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  async processPayment(amount: number, data: PaymentData) {
    // Implementación MercadoPago
  }
}

@Injectable()
export class StripeProvider implements PaymentProvider {
  async processPayment(amount: number, data: PaymentData) {
    // Implementación Stripe
  }
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PaymentProvider') private readonly provider: PaymentProvider,
  ) {}

  async process(amount: number, data: PaymentData) {
    return this.provider.processPayment(amount, data);
  }
}

// Agregar nuevo proveedor sin modificar PaymentService
@Injectable()
export class PayPalProvider implements PaymentProvider {
  async processPayment(amount: number, data: PaymentData) {
    // Nueva implementación
  }
}
```

### L - Liskov Substitution Principle (LSP)

**Los objetos de una superclase deben poder ser reemplazados por objetos de sus subclases sin romper la aplicación.**

Las implementaciones deben cumplir el contrato de sus interfaces/base classes.

```typescript
// ✅ Correcto - Las implementaciones son intercambiables
abstract class NotificationChannel {
  abstract send(message: string, recipient: string): Promise<void>;
}

@Injectable()
export class EmailChannel extends NotificationChannel {
  async send(message: string, recipient: string) {
    // Envía email
  }
}

@Injectable()
export class SMSChannel extends NotificationChannel {
  async send(message: string, recipient: string) {
    // Envía SMS
  }
}

@Injectable()
export class WhatsAppChannel extends NotificationChannel {
  async send(message: string, recipient: string) {
    // Envía WhatsApp
  }
}

// Cualquier implementación puede usarse sin romper el código
@Injectable()
export class NotificationService {
  constructor(private readonly channel: NotificationChannel) {}

  async notify(message: string, recipient: string) {
    // Funciona con cualquier implementación
    await this.channel.send(message, recipient);
  }
}
```

### I - Interface Segregation Principle (ISP)

**Los clientes no deben depender de interfaces que no usan.**

Crear interfaces específicas en lugar de interfaces grandes con muchos métodos.

```typescript
// ❌ Incorrecto - Interface demasiado grande
interface UserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  sendEmail(user: User): Promise<void>; // No es responsabilidad del repositorio
  generateReport(): Promise<Report>; // No es responsabilidad del repositorio
}

// ✅ Correcto - Interfaces segregadas
interface UserRepository {
  findById(id: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  create(data: CreateUserDto): Promise<User>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}

interface EmailService {
  sendEmail(user: User): Promise<void>;
}

interface ReportService {
  generateUserReport(): Promise<Report>;
}

// Los servicios solo dependen de lo que necesitan
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository, // Solo métodos de repositorio
    private readonly emailService: EmailService, // Solo métodos de email
  ) {}
}
```

### D - Dependency Inversion Principle (DIP)

**Depender de abstracciones, no de concreciones.**

Inyectar interfaces/abstracciones en lugar de implementaciones concretas.

```typescript
// ❌ Incorrecto - Dependencia directa de implementación
@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService) {} // Depende de Prisma directamente
}

// ✅ Correcto - Depende de abstracción
interface TournamentRepository {
  findById(id: string): Promise<Tournament>;
  findAll(filters: TournamentFilters): Promise<Tournament[]>;
  create(data: CreateTournamentDto): Promise<Tournament>;
  update(id: string, data: UpdateTournamentDto): Promise<Tournament>;
}

@Injectable()
export class PrismaTournamentRepository implements TournamentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.tournament.findUnique({ where: { id } });
  }
  // ... otros métodos
}

@Injectable()
export class TournamentService {
  constructor(
    private readonly tournamentRepository: TournamentRepository, // Depende de interfaz
  ) {}

  async findById(id: string) {
    return this.tournamentRepository.findById(id);
  }
}

// En el módulo, inyectar la implementación
@Module({
  providers: [
    TournamentService,
    {
      provide: 'TournamentRepository',
      useClass: PrismaTournamentRepository,
    },
  ],
})
export class TournamentsModule {}
```

### Aplicación Práctica en NestJS

#### Ejemplo Completo: Servicio de Partidos

```typescript
// ✅ Correcto - Aplicando todos los principios SOLID

// 1. Interfaces (DIP, ISP)
interface MatchRepository {
  findById(id: string): Promise<Match>;
  create(data: CreateMatchDto): Promise<Match>;
  updateStatus(id: string, status: MatchStatus): Promise<Match>;
}

interface StatsProcessor {
  process(matchId: string, liveStats: LiveStats): Promise<ProcessedStats>;
}

interface NotificationService {
  notifyMatchStatusChange(matchId: string, status: MatchStatus): Promise<void>;
}

// 2. Implementaciones (LSP)
@Injectable()
export class PrismaMatchRepository implements MatchRepository {
  constructor(private readonly prisma: PrismaService) {}
  // Implementación...
}

@Injectable()
export class BasketballStatsProcessor implements StatsProcessor {
  async process(matchId: string, liveStats: LiveStats) {
    // Procesa estadísticas de básquet
  }
}

@Injectable()
export class EmailNotificationService implements NotificationService {
  async notifyMatchStatusChange(matchId: string, status: MatchStatus) {
    // Envía notificaciones por email
  }
}

// 3. Servicio principal (SRP, DIP)
@Injectable()
export class MatchesService {
  constructor(
    @Inject('MatchRepository') private readonly repository: MatchRepository,
    @Inject('StatsProcessor') private readonly statsProcessor: StatsProcessor,
    @Inject('NotificationService') private readonly notificationService: NotificationService,
  ) {}

  // Responsabilidad única: gestionar partidos
  async createMatch(dto: CreateMatchDto): Promise<Match> {
    return this.repository.create(dto);
  }

  async finalizeMatch(matchId: string, liveStats: LiveStats): Promise<Match> {
    // Procesa estadísticas (OCP - extensible con diferentes procesadores)
    await this.statsProcessor.process(matchId, liveStats);
    
    // Actualiza estado
    const match = await this.repository.updateStatus(matchId, 'finalized');
    
    // Notifica (OCP - extensible con diferentes canales)
    await this.notificationService.notifyMatchStatusChange(matchId, 'finalized');
    
    return match;
  }
}

// 4. Módulo con inyección de dependencias (DIP)
@Module({
  providers: [
    MatchesService,
    {
      provide: 'MatchRepository',
      useClass: PrismaMatchRepository,
    },
    {
      provide: 'StatsProcessor',
      useClass: BasketballStatsProcessor, // Fácil cambiar a otro procesador
    },
    {
      provide: 'NotificationService',
      useClass: EmailNotificationService, // Fácil cambiar a otro canal
    },
  ],
})
export class MatchesModule {}
```

### Checklist SOLID

Al crear o modificar servicios, verificar:

- ✅ **SRP:** ¿El servicio tiene una sola responsabilidad?
- ✅ **OCP:** ¿Puedo extender funcionalidad sin modificar código existente?
- ✅ **LSP:** ¿Las implementaciones cumplen el contrato de sus interfaces?
- ✅ **ISP:** ¿Las interfaces son específicas y no tienen métodos innecesarios?
- ✅ **DIP:** ¿Dependo de abstracciones en lugar de implementaciones concretas?

## DTOs (Data Transfer Objects)

### Validación
- Usar `class-validator` para validación
- Usar `class-transformer` para transformación
- Documentar con Swagger cuando sea necesario

```typescript
// ✅ Correcto
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
```

## Prisma

### Uso del PrismaService
- Inyectar `PrismaService` en servicios
- Usar transacciones para operaciones múltiples
- Manejar errores de Prisma apropiadamente

```typescript
// ✅ Correcto
async createWithTeam(userData: CreateUserDto, teamData: CreateTeamDto) {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const team = await tx.team.create({
      data: {
        ...teamData,
        creatorId: user.id,
      },
    });
    return { user, team };
  });
}
```

### Queries
- Usar `select` para limitar campos cuando sea necesario
- Usar `include` para relaciones
- Paginación siempre que sea posible

```typescript
// ✅ Correcto
async findAll(page: number, limit: number) {
  return this.prisma.user.findMany({
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

## Autenticación y Autorización

### Guards
- Usar `AuthGuard` para verificar autenticación
- Usar `RolesGuard` para verificar roles
- Usar `PermissionsGuard` para permisos granulares

```typescript
// ✅ Correcto
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'referee')
@Controller('matches')
export class MatchesController {
  // ...
}
```

### Obtener Usuario Actual
- Usar decorador personalizado `@CurrentUser()`

```typescript
@Get('me')
async getProfile(@CurrentUser() user: User) {
  return this.usersService.findOne(user.id);
}
```

## Manejo de Errores

### Excepciones de NestJS
- `BadRequestException` - 400
- `UnauthorizedException` - 401
- `ForbiddenException` - 403
- `NotFoundException` - 404
- `ConflictException` - 409
- `InternalServerErrorException` - 500

```typescript
// ✅ Correcto
if (!user) {
  throw new NotFoundException(`User with ID ${id} not found`);
}

if (await this.isEmailTaken(email)) {
  throw new ConflictException('Email already registered');
}
```

## Logging

### Usar Logger de NestJS
```typescript
// ✅ Correcto
constructor(
  private readonly logger: Logger,
) {
  this.logger.setContext(UsersService.name);
}

this.logger.log('User created successfully');
this.logger.error('Failed to create user', error.stack);
this.logger.warn('Unusual activity detected');
```

## Testing

### Estructura de Tests
- Tests unitarios para servicios
- Tests de integración para controladores
- Mocks para dependencias externas

```typescript
// ✅ Correcto
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a user', async () => {
    const dto = { name: 'Test', email: 'test@test.com' };
    const result = await service.create(dto);
    expect(result).toHaveProperty('id');
  });
});
```

## Variables de Entorno

- Usar `@nestjs/config` para configuración
- Nunca hardcodear valores sensibles
- Validar variables de entorno al iniciar

```typescript
// ✅ Correcto
import { ConfigService } from '@nestjs/config';

constructor(
  private readonly configService: ConfigService,
) {
  const dbUrl = this.configService.get<string>('DATABASE_URL');
}
```

