/**
 * Prefetch utility
 * Implements FR-024b: Prefetch adjacent pages (N-1, N+1)
 * Uses requestIdleCallback or 200ms timeout (whichever comes first)
 */

/**
 * Prefetch a URL using requestIdleCallback or timeout fallback
 * @param url - The URL to prefetch
 * @param timeout - Timeout in milliseconds (default: 200ms per FR-024b)
 */
export function prefetchUrl(url: string, timeout = 200): void {
  // Create a promise that resolves when either idle callback fires or timeout occurs
  const prefetchPromise = new Promise<void>((resolve) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let idleCallbackId: number | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
    };

    const executePrefetch = () => {
      cleanup();
      
      // Use fetch with low priority to prefetch without blocking
      fetch(url, {
        method: 'HEAD', // Use HEAD to just check availability
        priority: 'low' as RequestPriority,
      })
        .then(() => resolve())
        .catch(() => resolve()); // Resolve even on error to avoid hanging
    };

    // Set up timeout fallback
    timeoutId = setTimeout(executePrefetch, timeout);

    // Set up requestIdleCallback if available
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(executePrefetch);
    }
  });

  prefetchPromise.catch(() => {
    // Silent catch to prevent unhandled promise rejections
  });
}

/**
 * Prefetch adjacent pages for a document
 * @param documentId - The document ID
 * @param currentPage - The current page number
 * @param totalPages - Total number of pages in the document
 * @param languageCode - The language code for markdown content
 */
export function prefetchAdjacentPages(
  documentId: string,
  currentPage: number,
  totalPages: number,
  languageCode: string
): void {
  const pagesToPrefetch: number[] = [];

  // Add previous page (N-1)
  if (currentPage > 1) {
    pagesToPrefetch.push(currentPage - 1);
  }

  // Add next page (N+1)
  if (currentPage < totalPages) {
    pagesToPrefetch.push(currentPage + 1);
  }

  // Prefetch PDF and markdown for each adjacent page
  pagesToPrefetch.forEach((pageNumber) => {
    const pdfUrl = `/api/documents/${encodeURIComponent(documentId)}/pages/${pageNumber}/pdf`;
    const markdownUrl = `/api/documents/${encodeURIComponent(documentId)}/pages/${pageNumber}/markdown?lang=${encodeURIComponent(languageCode)}`;

    // Prefetch with slight delay between requests to avoid flooding
    setTimeout(() => prefetchUrl(pdfUrl), 0);
    setTimeout(() => prefetchUrl(markdownUrl), 50);
  });
}

/**
 * Cache of prefetched pages to avoid redundant requests
 */
const prefetchCache = new Set<string>();

/**
 * Prefetch with caching to avoid duplicate requests
 * @param documentId - The document ID
 * @param currentPage - The current page number
 * @param totalPages - Total number of pages
 * @param languageCode - The language code
 */
export function prefetchAdjacentPagesWithCache(
  documentId: string,
  currentPage: number,
  totalPages: number,
  languageCode: string
): void {
  const cacheKey = `${documentId}-${currentPage}-${languageCode}`;
  
  if (prefetchCache.has(cacheKey)) {
    return; // Already prefetched
  }

  prefetchCache.add(cacheKey);
  prefetchAdjacentPages(documentId, currentPage, totalPages, languageCode);

  // Clean up old cache entries (keep last 10)
  if (prefetchCache.size > 10) {
    const oldestKey = prefetchCache.values().next().value;
    if (oldestKey) {
      prefetchCache.delete(oldestKey);
    }
  }
}
