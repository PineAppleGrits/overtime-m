/**
 * Genera el archivo `swagger.json` con la spec OpenAPI del API,
 * sin levantar el servidor HTTP. Output: `apps/api/swagger.json`.
 *
 * Uso:
 *   pnpm --filter overtime-be generate:openapi
 *
 * Lo consumen:
 * - `pnpm generate:api-types` (en el root) → usa la spec para generar tipos
 *   en `packages/shared/src/generated/api.d.ts` con openapi-typescript.
 * - El FE (manualmente o por CI) si quiere consumir la spec directamente.
 */
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from '../src/app.module';

async function generate() {
  try {
    process.loadEnvFile();
  } catch {
    // .env no es obligatorio para generar la spec.
  }

  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Overtime API')
    .setDescription('API spec for Overtime — generated for FE type generation.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
  const outPath = resolve(__dirname, '..', 'swagger.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2), 'utf-8');

  await app.close();
  // eslint-disable-next-line no-console
  console.log(`OpenAPI spec written to ${outPath}`);
}

generate().catch((err: Error) => {
  // eslint-disable-next-line no-console
  console.error('Error generating OpenAPI spec:', err);
  process.exit(1);
});
