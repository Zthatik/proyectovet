import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema/users';

const appUrl = process.env.BETTER_AUTH_URL || 'http://localhost:4321';

// Orígenes de confianza: la URL pública configurada + localhost para desarrollo.
// Se pueden añadir más vía BETTER_AUTH_TRUSTED_ORIGINS (separados por coma).
const trustedOrigins = [
  appUrl,
  'http://localhost:4321',
  'http://localhost:4322',
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
];

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'cliente',
        // SEGURIDAD: input:false evita que un usuario asigne su propio rol
        // durante el registro (escalada de privilegios). Los roles solo se
        // cambian desde el panel de administración.
        input: false,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
      },
      // input:false — solo se cambia desde el panel de admin (desactivar/activar).
      isActive: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
});

export type Session = typeof auth.$Infer.Session;
