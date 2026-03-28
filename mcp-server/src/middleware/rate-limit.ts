const counters = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 100;
const WINDOW_MS = 60_000;

export function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = counters.get(userId) ?? { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }
  entry.count++;
  counters.set(userId, entry);
  return { allowed: entry.count <= LIMIT, remaining: Math.max(0, LIMIT - entry.count) };
}
