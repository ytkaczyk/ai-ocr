/**
 * Debounce utility
 * Implements FR-024a: Debounce navigation (100ms)
 * Implements FR-024c: Debounce URL persistence (500ms)
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>): void {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced function with the ability to cancel pending invocations
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns An object with the debounced function and a cancel method
 */
export function debounceWithCancel<T extends (...args: never[]) => void>(
  func: T,
  wait: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  const flush = () => {
    if (timeoutId && lastArgs) {
      const args = lastArgs; // Save args before cancel clears them
      cancel();
      func(...args);
    }
  };

  const debounced = (...args: Parameters<T>): void => {
    lastArgs = args;

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
      lastArgs = null;
    }, wait);
  };

  return { debounced, cancel, flush };
}

/**
 * Debounce constants from requirements
 */
export const DEBOUNCE_NAVIGATION = 100; // FR-024a: Navigation debounce
export const DEBOUNCE_URL_PERSIST = 500; // FR-024c: URL persistence debounce
