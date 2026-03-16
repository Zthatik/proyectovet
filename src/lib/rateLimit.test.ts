import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, rateLimitMap } from './rateLimit';

describe('rateLimit', () => {
  beforeEach(() => {
    rateLimitMap.clear();
  });

  it('permite la primera request', () => {
    expect(rateLimit('test-key', 5, 60_000)).toBe(true);
  });

  it('permite requests hasta el límite', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('key-limit', 5, 60_000)).toBe(true);
    }
  });

  it('bloquea la request N+1 (sobre el límite)', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('key-block', 5, 60_000);
    }
    expect(rateLimit('key-block', 5, 60_000)).toBe(false);
  });

  it('bloquea todas las requests adicionales', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('key-extra', 3, 60_000);
    }
    expect(rateLimit('key-extra', 3, 60_000)).toBe(false);
    expect(rateLimit('key-extra', 3, 60_000)).toBe(false);
  });

  it('se resetea después de que la ventana expira', () => {
    // Insertar entrada expirada manualmente
    rateLimitMap.set('key-expired', { count: 10, resetAt: Date.now() - 1 });
    expect(rateLimit('key-expired', 5, 60_000)).toBe(true);
  });

  it('keys diferentes tienen contadores independientes', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('key-a', 3, 60_000);
    }
    // key-a está bloqueada
    expect(rateLimit('key-a', 3, 60_000)).toBe(false);
    // key-b sigue libre
    expect(rateLimit('key-b', 3, 60_000)).toBe(true);
  });

  it('límite de 1 bloquea en la segunda request', () => {
    expect(rateLimit('key-one', 1, 60_000)).toBe(true);
    expect(rateLimit('key-one', 1, 60_000)).toBe(false);
  });
});
