const store = new Map();
export async function checkIdempotency(key) {
    const entry = store.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.result;
}
export async function saveIdempotency(key, result) {
    store.set(key, { result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
}
//# sourceMappingURL=idempotency.js.map