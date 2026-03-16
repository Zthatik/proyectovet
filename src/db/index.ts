import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: import.meta.env.DATABASE_URL || process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle(pool);
