import { describe, it, expect, vi } from 'vitest';

// Mock pdfjs before importing
vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: '',
    },
  },
}));

/**
 * Unit tests for PDF.js worker configuration
 * Tests worker initialization
 */

describe('pdf-worker', () => {
  it('should configure PDF.js worker on import', async () => {
    // Import the module which should set the worker source
    await import('@/lib/utils/pdf-worker');
    
    const { pdfjs } = await import('react-pdf');
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toBe('/pdf.worker.mjs');
  });
});
