/**
 * Request cache utility
 * Prevents duplicate in-flight requests by caching pending promises
 * Helps eliminate duplicate fetches caused by React Strict Mode double-invocation
 */

interface CacheEntry {
  promise: Promise<Response>;
  timestamp: number;
}

const requestCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5000; // 5 seconds - enough to handle strict mode double-invocation

/**
 * Fetch with automatic deduplication of in-flight requests
 * If a request to the same URL is already in progress, returns the existing promise
 * Note: AbortSignal is excluded from cache key as it's unique per request
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Response promise
 */
export async function cachedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Create cache key excluding signal (which is unique per request)
  const { signal: _signal, ...cacheableOptions } = options || {};
  const cacheKey = `${url}-${JSON.stringify(cacheableOptions)}`;
  
  // Check if we have a cached in-flight request
  const cached = requestCache.get(cacheKey);
  if (cached) {
    // Check if cache entry is still fresh
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      // Return a clone of the cached response
      return cached.promise.then((response) => response.clone());
    }
    // Cache expired, remove it
    requestCache.delete(cacheKey);
  }

  // Create new request using standard fetch (including signal)
  const fetchPromise = fetch(url, options);
  
  // Cache the promise
  requestCache.set(cacheKey, {
    promise: fetchPromise,
    timestamp: Date.now(),
  });

  // Clean up cache after a short delay to allow strict mode double-invocation to reuse
  fetchPromise
    .finally(() => {
      setTimeout(() => requestCache.delete(cacheKey), 100);
    });

  return fetchPromise;
}

/**
 * Clear all cached requests
 * Useful for testing or manual cache invalidation
 */
export function clearRequestCache(): void {
  requestCache.clear();
}
