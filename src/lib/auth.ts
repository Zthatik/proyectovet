import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema/users';
import { owners } from '../db/schema/patients';

/**
 * Al registrarse un usuario (rol tutor por defecto) se le asegura una ficha de
 * tutor (owner). Si ya existe una ficha con su mismo correo y sin cuenta
 * vinculada (creada antes por la clínica), se vincula y así hereda sus
 * mascotas; de lo contrario se crea una ficha nueva.
 */
async function ensureOwnerForUser(user: { id: string; name?: string | null; email: string; phone?: string | null }) {
  const fullName = (user.name ?? '').trim();
  const spaceIdx = fullName.indexOf(' ');
  const firstName = spaceIdx === -1 ? fullName : fullName.slice(0, spaceIdx);
  const lastName = spaceIdx === -1 ? '' : fullName.slice(spaceIdx + 1);

  // ¿Existe una ficha con ese correo y aún sin cuenta vinculada?
  const [existing] = await db
    .select({ id: owners.id })
    .from(owners)
    .where(and(sql`lower(${owners.email}) = lower(${user.email})`, isNull(owners.userId)))
    .limit(1);

  if (existing) {
    await db.update(owners).set({ userId: user.id }).where(eq(owners.id, existing.id));
    return;
  }

  await db.insert(owners).values({
    userId: user.id,
    firstName: firstName || user.email,
    lastName,
    email: user.email,
    phone: user.phone ?? null,
  });
}

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
