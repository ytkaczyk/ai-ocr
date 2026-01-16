/**
 * Retry utility for handling transient failures
 * Implements FR-026a: Document load retry
 * Implements FR-026b: Page navigation retry
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'fetchFn'>> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  shouldRetry: (error: Error) => {
    // Retry on network errors, timeouts, and server errors
    const retryableErrors = [
      'fetch',
      'network',
      'timeout',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'Failed to fetch',
      '500',
      '502',
      '503',
      '504',
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((keyword) => errorMessage.includes(keyword.toLowerCase()));
  },
};

/**
 * Retry a function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry options
 * @returns The result of the function
 * @throws The last error if all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let currentDelay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt >= opts.maxAttempts || !opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= opts.backoffMultiplier;
    }
  }

  // This should never happen, but TypeScript doesn't know that
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Retry a fetch request
 * @param url - The URL to fetch
 * @param init - Fetch init options
 * @param options - Retry options
 * @returns The fetch response
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const fetchFn = options.fetchFn || fetch;
  
  return retry(
    async () => {
      const response = await fetchFn(url, init);
      
      // Treat non-OK responses as errors for retry logic
      if (!response.ok && response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      ...options,
    }
  );
}
