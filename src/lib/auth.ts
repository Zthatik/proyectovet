import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { users, sessions, accounts, verifications } from '../db/schema/users';

const appUrl = process.env.BETTER_AUTH_URL || 'http://localhost:4321';

export const auth = betterAuth({
  baseURL: appUrl,
  trustedOrigins: [appUrl],
  database: drizzleAdapter(db, {
    provider: 'mysql',
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
        input: true,
      },
      phone: {
        type: 'string',
        required: false,
        input: true,
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
