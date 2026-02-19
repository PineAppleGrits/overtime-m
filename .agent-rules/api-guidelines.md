# Guías para Desarrollo de APIs

## Convenciones REST

### Endpoints
- Usar sustantivos, no verbos
- Plural para recursos
- Nested resources cuando tenga sentido

```
✅ Correcto
GET    /api/tournaments
GET    /api/tournaments/:id
POST   /api/tournaments
PUT    /api/tournaments/:id
DELETE /api/tournaments/:id

GET    /api/tournaments/:id/categories
POST   /api/tournaments/:id/categories

❌ Incorrecto
GET    /api/getTournaments
POST   /api/createTournament
GET    /api/tournament/:id/getCategories
```

### Métodos HTTP
- `GET` - Obtener recursos
- `POST` - Crear recursos
- `PUT` - Actualizar recurso completo
- `PATCH` - Actualizar recurso parcial
- `DELETE` - Eliminar recurso

### Códigos de Estado
- `200 OK` - Éxito en GET, PUT, PATCH
- `201 Created` - Éxito en POST
- `204 No Content` - Éxito en DELETE
- `400 Bad Request` - Request inválido
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - No autorizado
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: email duplicado)
- `500 Internal Server Error` - Error del servidor

## Respuestas

### Formato Estándar
```typescript
// ✅ Éxito - Lista
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}

// ✅ Éxito - Item único
{
  "data": { ... }
}

// ✅ Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Paginación
```typescript
// Query parameters
GET /api/tournaments?page=1&limit=10&sort=createdAt&order=desc

// Response
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Validación

### DTOs
- Validar todos los inputs
- Mensajes de error claros
- Validación en backend (nunca confiar en frontend)

```typescript
// ✅ Correcto
export class CreateTournamentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
```

## Autenticación

### Headers
```
Authorization: Bearer <token>
```

### Endpoints Públicos
- Marcar con `@Public()` decorator
- No requieren autenticación

### Endpoints Protegidos
- Requieren `AuthGuard`
- Obtener usuario con `@CurrentUser()`

```typescript
@Get('me')
@UseGuards(AuthGuard)
async getProfile(@CurrentUser() user: User) {
  return this.usersService.findOne(user.id);
}
```

## Filtros y Búsqueda

### Query Parameters
```
GET /api/tournaments?status=visible&sport=basketball&search=summer
```

```typescript
// ✅ Correcto
export class TournamentQueryDto {
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

## Versionado

### Estrategia
- Incluir versión en path: `/api/v1/tournaments`
- O en headers: `Accept: application/vnd.api+json;version=1`

```typescript
// ✅ Correcto
@Controller('v1/tournaments')
export class TournamentsController {
  // ...
}
```

## Documentación

### Swagger/OpenAPI
- Documentar todos los endpoints
- Incluir ejemplos
- Describir parámetros y respuestas

```typescript
@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
  @Get()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiResponse({ status: 200, description: 'List of tournaments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async findAll(@Query() query: TournamentQueryDto) {
    // ...
  }
}
```

## Rate Limiting

### Implementación
- Limitar requests por IP/usuario
- Diferentes límites por endpoint
- Headers de respuesta con límites

```typescript
@Throttle(10, 60) // 10 requests per 60 seconds
@Get('public')
async getPublicData() {
  // ...
}
```

## CORS

### Configuración
- Configurar en NestJS
- Permitir solo dominios necesarios
- Headers apropiados

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

## Webhooks

### Estructura
- Endpoint dedicado para webhooks
- Verificar firma cuando sea posible
- Procesar asíncronamente

```typescript
@Post('webhooks/mercadopago')
async handleMercadoPagoWebhook(
  @Body() payload: any,
  @Headers('x-signature') signature: string,
) {
  // Verificar firma
  if (!this.verifySignature(payload, signature)) {
    throw new UnauthorizedException();
  }
  
  // Procesar webhook
  await this.paymentsService.processWebhook(payload);
  
  return { received: true };
}
```

## Testing de APIs

### Tests de Integración
```typescript
describe('TournamentsController (e2e)', () => {
  it('/tournaments (GET)', () => {
    return request(app.getHttpServer())
      .get('/tournaments')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });

  it('/tournaments (POST)', () => {
    return request(app.getHttpServer())
      .post('/tournaments')
      .send({ name: 'Test Tournament' })
      .expect(201);
  });
});
```

