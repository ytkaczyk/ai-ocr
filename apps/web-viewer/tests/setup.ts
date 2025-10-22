import '@testing-library/jest-dom';
import { beforeAll, afterAll } from 'vitest';

// Suppress React 19 act() warnings from async child component updates
// These are expected when testing components that render async children
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to') &&
      args[0].includes('inside a test was not wrapped in act')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
