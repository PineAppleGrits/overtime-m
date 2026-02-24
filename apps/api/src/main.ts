import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  process.loadEnvFile();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: Helmet adds various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding from other origins if needed
    }),
  );

  // Performance: Enable gzip compression for responses
  //app.use(compression());

  // Global exception filter - catches all unhandled exceptions
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  const corsOrigin = configService.get<string>('app.corsOrigin');
  app.enableCors({
    origin:
      corsOrigin?.split(',').map((o) => o.trim()) || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Overtime API')
    .setDescription(
      `API para el sistema de gestión de torneos deportivos Overtime.
      
## Autenticación
La mayoría de endpoints requieren autenticación mediante Bearer token de Supabase.
Incluye el header: \`Authorization: Bearer <token>\`

## Roles
- **admin**: Acceso completo al sistema
- **player**: Jugador registrado
- **referee**: Árbitro
- **table_official**: Oficial de mesa
- **photographer**: Fotógrafo

## Códigos de Estado
- \`200\`: Éxito
- \`201\`: Recurso creado
- \`400\`: Error de validación
- \`401\`: No autenticado
- \`403\`: Sin permisos
- \`404\`: No encontrado
- \`409\`: Conflicto (duplicado)
- \`500\`: Error interno`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token de Supabase Auth',
      },
      'access-token',
    )
    .addTag('auth', 'Autenticación y perfiles')
    .addTag('tournaments', 'Gestión de torneos')
    .addTag('categories', 'Categorías de torneos')
    .addTag('zones', 'Zonas dentro de categorías')
    .addTag('teams', 'Gestión de equipos')
    .addTag('matches', 'Gestión de partidos')
    .addTag('venues', 'Canchas y locaciones')
    .addTag('registrations', 'Inscripciones a torneos')
    .addTag('fixtures', 'Standings')
    .addTag('sports', 'Deportes disponibles')
    .addTag('payments', 'Sistema de pagos')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Overtime API Docs',
  });

  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  await app.listen(port);

  logger.log(`Environment: ${nodeEnv}`);
  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();
