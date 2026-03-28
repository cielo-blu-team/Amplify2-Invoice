const BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

export async function apiCall<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown,
  token?: string,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw { code: 'INTERNAL_ERROR', message: (err as { message?: string }).message ?? 'API呼び出しエラー' };
  }
  return res.json() as Promise<T>;
}
