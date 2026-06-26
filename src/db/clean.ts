import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function clean() {
  const connection = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(connection);

  console.log('🧹 Limpiando base de datos...');

  const tables = [
    'payments',
    'invoice_items',
    'invoices',
    'stock_movements',
    'prescription_items',
    'prescriptions',
    'lab_orders',
    'medical_records',
    'vaccines',
    'appointments',
    'veterinarian_schedules',
    'products',
    'patients',
    'owners',
  ];

  // RESTART IDENTITY reinicia las secuencias; CASCADE respeta las FK
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`)
  );
  for (const table of tables) console.log(`  ✅ ${table}`);

  // Borrar usuarios de prueba (no el admin real)
  await db.execute(sql`
    DELETE FROM users
    WHERE email NOT IN ('admin@vetclinic.com')
  `);
  // También limpiar sesiones y cuentas huérfanas
  await db.execute(sql`DELETE FROM sessions`);
  await db.execute(sql`DELETE FROM accounts WHERE user_id NOT IN (SELECT id FROM users)`);

  console.log('');
  console.log('🎉 Base de datos limpia.');
  console.log('👤 Usuario admin conservado: admin@vetclinic.com');

  await connection.end();
}

clean().catch((e) => { console.error('❌ Error:', e); process.exit(1); });
