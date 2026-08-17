import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

/**
 * Guards the geometry of the PDF fixtures behind the FR-029a-d E2E tests.
 *
 * These fixtures previously claimed to cover landscape, rotated, oversized and
 * undersized pages while actually containing a single ordinary letter page, so
 * the E2E tests passed without exercising anything. This pins what they must
 * contain; regenerate with scripts/generate-edge-case-fixtures.mjs.
 */

const DATA_FOLDER = path.resolve(process.cwd(), 'data');

// ISO page sizes in PDF points, used as the thresholds in FR-029c/FR-029d
const A3 = { width: 842, height: 1191 };
const A5 = { width: 420, height: 595 };

async function loadPages(id: string) {
  const bytes = await readFile(path.join(DATA_FOLDER, `${id}.pdf`));
  const doc = await PDFDocument.load(new Uint8Array(bytes), { updateMetadata: false });

  return doc.getPages().map((page) => ({
    width: page.getWidth(),
    height: page.getHeight(),
    rotation: page.getRotation().angle,
  }));
}

async function countMarkdownPages(id: string) {
  const files = await readdir(path.join(DATA_FOLDER, id, 'en-US'));
  return files.filter((file) => /_page_\d+\.md$/.test(file)).length;
}

describe('test-edge-cases.pdf', () => {
  it('should have one page per markdown page file', async () => {
    const pages = await loadPages('test-edge-cases');

    expect(pages).toHaveLength(await countMarkdownPages('test-edge-cases'));
  });

  it('should contain a landscape page (FR-029a)', async () => {
    const pages = await loadPages('test-edge-cases');

    expect(pages.some((p) => p.width > p.height)).toBe(true);
  });

  it('should contain a rotated page (FR-029b)', async () => {
    const pages = await loadPages('test-edge-cases');

    expect(pages.some((p) => p.rotation % 360 !== 0)).toBe(true);
  });

  it('should contain a page smaller than A5 (FR-029d)', async () => {
    const pages = await loadPages('test-edge-cases');

    expect(pages.some((p) => p.width < A5.width && p.height < A5.height)).toBe(true);
  });
});

describe('very-large-pages.pdf', () => {
  it('should have one page per markdown page file', async () => {
    const pages = await loadPages('very-large-pages');

    expect(pages).toHaveLength(await countMarkdownPages('very-large-pages'));
  });

  it('should contain only pages larger than A3 (FR-029c)', async () => {
    const pages = await loadPages('very-large-pages');

    expect(pages.length).toBeGreaterThan(0);
    for (const page of pages) {
      expect(page.width).toBeGreaterThan(A3.width);
      expect(page.height).toBeGreaterThan(A3.height);
    }
  });
});
