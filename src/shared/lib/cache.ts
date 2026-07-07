/**
 * Server-side in-memory cache with TTL and request deduplication.
 *
 * In Next.js, this resets on HMR in development and on server restart in production.
 * During a single process lifetime, identical requests are deduplicated automatically.
 *
 * Usage:
 *   const cachedList = cacheAsync(listContentsAllAccounts, { ttl: 30_000 });
 *   const data = await cachedList({ accountIds: [...] });
 */

export interface CacheOptions {
    /** Time-to-live in milliseconds (default: 30_000) */
    ttl?: number;
    /** Unique key to distinguish this cache namespace (default: auto-generated per function) */
    key?: string;
}

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export type CachedFn<TArgs extends unknown[], TReturn> = {
    (...args: TArgs): Promise<TReturn>;
    /** Invalidate this cache namespace */
    invalidate: () => void;
};

// Global map for all cache namespaces — key = `<func_key>:<serialized_args>`
const _cacheStore = new Map<string, CacheEntry<unknown>>();
// Track pending promises for deduplication — key = `<func_key>:<serialized_args>`
const _pendingStore = new Map<string, Promise<unknown>>();
let _namespaceCounter = 0;

function serializeKey(args: unknown[]): string {
    // Quick heuristic: stringify args joined by \x00 delimiter
    // Works for primitives, objects (via JSON), arrays
    return args.map((a) => {
        if (typeof a === "undefined") return "__undef__";
        if (a === null) return "__null__";
        if (typeof a === "string" || typeof a === "number" || typeof a === "boolean") return String(a);
        return JSON.stringify(a);
    }).join("\x00");
}

/**
 * Wrap an async function with TTL-based caching and automatic deduplication.
 */
export function cacheAsync<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options?: CacheOptions
): CachedFn<TArgs, TReturn> {
    const namespace = options?.key ?? `ns_${_namespaceCounter++}`;
    const ttl = options?.ttl ?? 30_000;

    const cachedFn = async (...args: TArgs): Promise<TReturn> => {
        const key = `${namespace}:${serializeKey(args)}`;

        // Check cache hit
        const entry = _cacheStore.get(key);
        if (entry && entry.expiresAt > Date.now()) {
            return entry.value as TReturn;
        }

        // Return pending promise if same call is in-flight (deduplication)
        const pending = _pendingStore.get(key);
        if (pending) {
            return pending as Promise<TReturn>;
        }

        // Execute function and store pending result
        const promise = fn(...args)
            .then((value) => {
                _cacheStore.set(key, { value, expiresAt: Date.now() + ttl });
                return value;
            })
            .finally(() => {
                _pendingStore.delete(key);
            });

        _pendingStore.set(key, promise);
        return promise as Promise<TReturn>;
    };

    cachedFn.invalidate = () => {
        for (const key of _cacheStore.keys()) {
            if (key.startsWith(`${namespace}:`)) {
                _cacheStore.delete(key);
            }
        }
    };

    return cachedFn;
}
