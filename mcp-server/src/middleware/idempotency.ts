const store = new Map<string, { result: unknown; expiresAt: number }>();

export async function checkIdempotency(key: string): Promise<unknown | null> {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.result;
}

export async function saveIdempotency(key: string, result: unknown): Promise<void> {
  store.set(key, { result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
}
