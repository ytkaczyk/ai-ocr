import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

/**
 * Test setup utilities
 * Provides common test configuration and cleanup
 */

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Re-export common testing utilities for convenience
export { expect };
