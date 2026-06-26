import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle/migrations',
  schema: './src/db/schema/*',
  dialect: 'postgresql',
  dbCredentials: {
    // Migraciones a través de la conexión directa (puerto 5432), no del pooler.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL!,
  },
});
