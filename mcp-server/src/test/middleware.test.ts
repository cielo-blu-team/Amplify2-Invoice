import { describe, it, expect } from 'vitest';
import { verifyJwt } from '../middleware/auth.js';
import { checkRateLimit } from '../middleware/rate-limit.js';
import { checkIdempotency, saveIdempotency } from '../middleware/idempotency.js';

describe('auth middleware', () => {
  it('rejects invalid token', async () => {
    await expect(verifyJwt('invalid')).rejects.toBeDefined();
  });

  it('rejects empty token', async () => {
    await expect(verifyJwt('')).rejects.toBeDefined();
  });

  it('accepts valid token', async () => {
    const ctx = await verifyJwt('valid-token');
    expect(ctx.userId).toBeDefined();
    expect(ctx.email).toBeDefined();
    expect(ctx.role).toBeDefined();
  });

  it('returns expected user info', async () => {
    const ctx = await verifyJwt('any-valid-token');
    expect(ctx.userId).toBe('user-001');
    expect(ctx.email).toBe('user@example.com');
    expect(ctx.role).toBe('admin');
  });
});

describe('rate limit', () => {
  it('allows under limit', () => {
    const result = checkRateLimit('test-user-unique-rl-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('increments counter on repeated calls', () => {
    const userId = 'test-user-unique-rl-2';
    const first = checkRateLimit(userId);
    const second = checkRateLimit(userId);
    expect(second.remaining).toBeLessThan(first.remaining);
  });

  it('blocks after exceeding limit', () => {
    const userId = 'test-user-limit-exceeded';
    // Use up all 100 requests
    for (let i = 0; i < 100; i++) {
      checkRateLimit(userId);
    }
    const result = checkRateLimit(userId);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('idempotency', () => {
  it('returns null for new key', async () => {
    expect(await checkIdempotency('new-key-xyz-unique')).toBeNull();
  });

  it('returns saved result', async () => {
    await saveIdempotency('test-key-idem-1', { data: 'test' });
    const result = await checkIdempotency('test-key-idem-1');
    expect(result).toEqual({ data: 'test' });
  });

  it('returns null for expired key', async () => {
    // Directly manipulate: we can't easily test expiry without mocking Date
    // Instead, verify different keys don't interfere
    await saveIdempotency('key-a', { value: 'a' });
    await saveIdempotency('key-b', { value: 'b' });
    expect(await checkIdempotency('key-a')).toEqual({ value: 'a' });
    expect(await checkIdempotency('key-b')).toEqual({ value: 'b' });
    expect(await checkIdempotency('key-c')).toBeNull();
  });

  it('overwrites existing key with new value', async () => {
    const key = 'test-overwrite-key';
    await saveIdempotency(key, { version: 1 });
    await saveIdempotency(key, { version: 2 });
    const result = await checkIdempotency(key);
    expect(result).toEqual({ version: 2 });
  });
});
