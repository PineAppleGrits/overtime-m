import { defineConfig } from 'prisma/config';

try {
  process.loadEnvFile();
} catch (error) {
  // Ignore error if .env file doesn't exist (e.g. in production)
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
