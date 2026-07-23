import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema/users';
import { owners } from '../db/schema/patients';

/**
 * Al registrarse un usuario (rol tutor por defecto) se le crea siempre una
 * ficha de tutor (owner) nueva y vacía.
 *
 * SEGURIDAD: antes esta función vinculaba automáticamente al usuario nuevo
 * con cualquier ficha de owner preexistente que tuviera el mismo email como
 * texto — sin verificar que la persona controlara realmente ese correo. Eso
 * permitía que cualquiera que conociera el email de un tutor real (ej. visto
 * en una factura) se registrara primero con ese email y heredara acceso a
 * sus mascotas, historial médico y facturas. Ahora la única forma de
 * vincular una cuenta nueva a una ficha existente es a través de una
 * invitación de un solo uso que el staff genera explícitamente
 * (POST /api/owners/[id]/invite) y que el tutor redime tras registrarse
 * (POST /api/invites/redeem). Ver src/pages/api/invites/redeem.ts.
 */
async function ensureOwnerForUser(user: { id: string; name?: string | null; email: string; phone?: string | null }) {
  const fullName = (user.name ?? '').trim();
  const spaceIdx = fullName.indexOf(' ');
  const firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? '' : fullName.slice(spaceIdx + 1);

  await db.insert(owners).values({
    userId: user.id,
    firstName: firstName || user.email,
    lastName,
    email: user.email,
    phone: user.phone ?? null,
  });
}

const appUrl = process.env.BETTER_AUTH_URL || 'http://localhost:4321';
const isProduction = process.env.NODE_ENV === 'production';

// Orígenes de confianza: la URL pública configurada + localhost solo fuera de
// producción. Se pueden añadir más vía BETTER_AUTH_TRUSTED_ORIGINS (separados por coma).
const trustedOrigins = [
  appUrl,
  ...(isProduction ? [] : ['http://localhost:4321', 'http://localhost:4322']),
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
        defaultValue: 'tutor',
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
    expiresIn: 60 * 60 * 24 * 7, // 7 días: sesión completa antes de exigir volver a iniciar sesión.
    updateAge: 60 * 60 * 24, // se renueva si hay actividad al menos una vez al día.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await ensureOwnerForUser(user as any);
          } catch (err) {
            // No bloquear el registro si falla la creación de la ficha de tutor.
            console.error('[auth] No se pudo crear/vincular la ficha de tutor:', err);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
