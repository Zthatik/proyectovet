import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString =
  import.meta.env?.DATABASE_URL || process.env.DATABASE_URL;

// `prepare: false` es obligatorio para el pooler de transacciones de Supabase
// (puerto 6543). Ver: https://orm.drizzle.team/docs/connect-supabase
const client = postgres(connectionString!, { prepare: false });

export const db = drizzle(client);
