import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

/**
 * Respaldo manual de la base de datos completa a un archivo JSON local.
 *
 * IMPORTANTE — esto NO es un respaldo automático. El plan gratuito de
 * Supabase no ejecuta backups diarios ni Point-in-Time Recovery (eso
 * requiere el plan Pro). Este script sirve para:
 *   1. Correrlo manualmente antes de una operación riesgosa
 *      (npx tsx src/db/backup.ts).
 *   2. Como base para automatizarlo (ej. GitHub Actions con cron) una vez
 *      que definas dónde subir el archivo resultante (S3, Google Drive,
 *      Backblaze B2, etc. — requiere tus propias credenciales).
 *
 * Los archivos se guardan en ./backups (ya está en .gitignore) — NUNCA
 * subas un backup con datos reales de tutores/mascotas a un repositorio.
 */
async function backup() {
  const connection = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(connection);

  console.log('💾 Respaldando base de datos...\n');

  const tablesResult = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  const tableNames = (tablesResult as unknown as { tablename: string }[]).map((r) => r.tablename);

  const dump: Record<string, unknown[]> = {};
  for (const table of tableNames) {
    const rows = await db.execute(sql.raw(`SELECT * FROM "${table}"`));
    dump[table] = rows as unknown as unknown[];
    console.log(`  ✅ ${table} (${(rows as unknown[]).length} filas)`);
  }

  const dir = path.resolve('backups');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `backup-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dump, null, 2), 'utf-8');

  console.log(`\n🎉 Respaldo guardado en: ${filePath}`);
  console.log('⚠️  Contiene datos personales reales — no lo subas a git ni lo compartas.');

  await connection.end();
}

backup().catch((e) => { console.error('❌ Error:', e); process.exit(1); });
