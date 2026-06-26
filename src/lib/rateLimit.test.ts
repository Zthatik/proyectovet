import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de la BD: rateLimit hace db.execute(...) y usa el `count` devuelto.
const execute = vi.fn();
vi.mock('../db', () => ({ db: { execute: (...args: unknown[]) => execute(...args) } }));

import { rateLimit } from './rateLimit';

describe('rateLimit (Postgres-backed)', () => {
  beforeEach(() => execute.mockReset());

  it('permite cuando el contador está bajo el límite', async () => {
    execute.mockResolvedValueOnce([{ count: 1 }]);
    expect(await rateLimit('k', 5, 60_000)).toBe(true);
  });

  it('permite exactamente hasta el límite', async () => {
    execute.mockResolvedValueOnce([{ count: 5 }]);
    expect(await rateLimit('k', 5, 60_000)).toBe(true);
  });

  it('bloquea cuando el contador supera el límite', async () => {
    execute.mockResolvedValueOnce([{ count: 6 }]);
    expect(await rateLimit('k', 5, 60_000)).toBe(false);
  });

  it('límite de 1 bloquea en la segunda (count=2)', async () => {
    execute.mockResolvedValueOnce([{ count: 2 }]);
    expect(await rateLimit('k', 1, 60_000)).toBe(false);
  });

  it('hace fail-open si la BD lanza error', async () => {
    execute.mockRejectedValueOnce(new Error('db down'));
    expect(await rateLimit('k', 5, 60_000)).toBe(true);
  });

  it('asume permitido si no devuelve filas', async () => {
    execute.mockResolvedValueOnce([]);
    expect(await rateLimit('k', 5, 60_000)).toBe(true);
  });
});
