import { describe, it, expect } from 'vitest';
import path from 'path';
import { getPdfPageCount } from '@/lib/utils/pdf';
import { FileSystemError, PdfProcessingError } from '@/lib/utils/errors';

/**
 * Unit tests for server-side PDF metadata helpers
 * Tests FR-033e: error messages must not disclose filesystem paths
 */

const dataFolder = path.resolve(process.cwd(), 'data');

describe('getPdfPageCount', () => {
  it('should read the page count from a valid PDF', async () => {
    const pageCount = await getPdfPageCount(path.join(dataFolder, 'kombucha.pdf'));

    expect(pageCount).toBeGreaterThan(0);
    expect(Number.isInteger(pageCount)).toBe(true);
  });

  it('should throw PdfProcessingError for an unparseable PDF', async () => {
    await expect(
      getPdfPageCount(path.join(dataFolder, 'test-corrupted-pdf.pdf'))
    ).rejects.toBeInstanceOf(PdfProcessingError);
  });

  it('should throw FileSystemError when the file does not exist', async () => {
    await expect(
      getPdfPageCount(path.join(dataFolder, 'does-not-exist.pdf'))
    ).rejects.toBeInstanceOf(FileSystemError);
  });

  it('should not disclose filesystem paths in error messages', async () => {
    await expect(
      getPdfPageCount(path.join(dataFolder, 'does-not-exist.pdf'))
    ).rejects.toThrow(/^(?!.*does-not-exist).*$/);
  });
});
