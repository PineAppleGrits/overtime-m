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
    // Use direct connection (port 5432) for migrations to avoid Supabase pooler issues.
    // Falls back to DATABASE_URL (pooler) if DIRECT_DATABASE_URL is not set.
    url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  },
});
