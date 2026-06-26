import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';

// Rate limiting persistente (compartido entre invocaciones serverless).
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(1),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
}, (t) => ({
  idxResetAt: index('idx_rate_limits_reset_at').on(t.resetAt),
}));
