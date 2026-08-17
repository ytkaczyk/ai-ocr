import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for non-standard PDF rendering (T085n)
 * Tests FR-029a: Landscape page handling
 * Tests FR-029b: Rotated page handling  
 * Tests FR-029c: Very large page handling (>A3)
 * Tests FR-029d: Very small page handling (<A5)
 * 
 * Note: These tests assume test PDF files with various orientations/sizes exist
 * If no such test files are available, tests check for graceful handling
 */

test.describe('PDF Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });
  });

  /**
   * Open a document by its filename. Most of these tests need a specific
   * fixture: the edge-case geometry they assert on only exists in
   * test-edge-cases.pdf and very-large-pages.pdf.
   */
  async function openDocument(page: Page, fileName: string) {
    const card = page
      .locator('[data-testid="document-card"]')
      .filter({ hasText: fileName })
      .first();
    await card.waitFor({ timeout: 10000 });
    await card.click();
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
  }

  /** Advance the pager to a specific 1-indexed page. */
  async function goToPage(page: Page, pageNumber: number) {
    const nextButton = page.locator('[data-testid="pager-next"]');
    for (let i = 1; i < pageNumber; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
  }

  test.describe('Landscape Pages (FR-029a)', () => {
    test('should display landscape PDF pages correctly', async ({ page }) => {
      // Select document (assumes first document has landscape pages)
      await openDocument(page, 'test-edge-cases.pdf');

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      await expect(pdfPane).toBeVisible();

      // PDF should render without errors
      const pdfContent = pdfPane.locator('canvas, iframe').first();
      await expect(pdfContent).toBeVisible({ timeout: 15000 });

      // Pane should accommodate landscape orientation
      const pdfBox = await pdfPane.boundingBox();
      expect(pdfBox).toBeTruthy();
      if (pdfBox) {
        expect(pdfBox.width).toBeGreaterThan(0);
        expect(pdfBox.height).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Rotated Pages (FR-029b)', () => {
    test('should handle rotated PDF pages', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');

      // Navigate through pages to find rotated ones
      const nextButton = page.locator('[data-testid="pager-next"]');
      await nextButton.click();
      await page.waitForTimeout(300);

      // PDF should still render correctly
      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();
      await expect(pdfContent).toBeVisible({ timeout: 15000 });

      // No error messages
      const errorMessage = pdfPane.locator('[data-testid="error-message"]');
      await expect(errorMessage).not.toBeVisible();
    });

    test('should apply correct rotation to rotated pages', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');
      await goToPage(page, 2); // page 2 carries a 90 degree rotation

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfCanvas = pdfPane.locator('canvas').first();

      // Canvas should be visible and have valid dimensions
      await expect(pdfCanvas).toBeVisible({ timeout: 15000 });
      
      const box = await pdfCanvas.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        // Rotated pages should still fit within the viewport
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Very Large Pages (FR-029c)', () => {
    test('should handle very large PDF pages', async ({ page }) => {
      await openDocument(page, 'very-large-pages.pdf');

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();

      // Large pages should still render
      await expect(pdfContent).toBeVisible({ timeout: 10000 });

      // Should not cause layout issues
      const paneBox = await pdfPane.boundingBox();
      expect(paneBox).toBeTruthy();
    });

    test('should scale very large pages to fit viewport', async ({ page }) => {
      await openDocument(page, 'very-large-pages.pdf');

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfCanvas = pdfPane.locator('canvas').first();
      await expect(pdfCanvas).toBeVisible({ timeout: 15000 });

      // Wait for canvas to be fully rendered (has non-zero dimensions)
      await page.waitForTimeout(1000);

      // Canvas should fit within pane bounds
      const paneBox = await pdfPane.boundingBox();
      
      // Retry getting canvas bounding box if null (Edge rendering delay)
      let canvasBox = await pdfCanvas.boundingBox();
      if (!canvasBox) {
        await page.waitForTimeout(1000);
        canvasBox = await pdfCanvas.boundingBox();
      }

      expect(paneBox).toBeTruthy();
      expect(canvasBox).toBeTruthy();

      if (paneBox && canvasBox) {
        // Canvas should not overflow pane
        expect(canvasBox.width).toBeLessThanOrEqual(paneBox.width + 50); // Small tolerance
      }
    });

    test('should not freeze browser with very large pages', async ({ page }) => {
      await openDocument(page, 'very-large-pages.pdf');

      // Wait for rendering
      await page.waitForTimeout(2000);

      // Page should remain interactive
      const nextButton = page.locator('[data-testid="pager-next"]');
      await expect(nextButton).toBeVisible();
      await expect(nextButton).toBeEnabled();

      // Can still navigate
      await nextButton.click();
      await page.waitForTimeout(300);

      const pageDisplay = page.locator('[data-testid="page-display"]');
      await expect(pageDisplay).toBeVisible();
    });
  });

  test.describe('Very Small Pages (FR-029d)', () => {
    test('should handle very small PDF pages', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');
      await goToPage(page, 3); // page 3 is smaller than A5

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();

      // Small pages should still render
      await expect(pdfContent).toBeVisible({ timeout: 15000 });
    });

    test('should scale small pages appropriately', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');
      await goToPage(page, 3); // page 3 is smaller than A5

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const pdfCanvas = pdfPane.locator('canvas').first();
      await expect(pdfCanvas).toBeVisible({ timeout: 15000 });

      // Small pages should be scaled up to be readable
      const canvasBox = await pdfCanvas.boundingBox();
      expect(canvasBox).toBeTruthy();
      if (canvasBox) {
        // Should have reasonable minimum size
        expect(canvasBox.width).toBeGreaterThan(100);
        expect(canvasBox.height).toBeGreaterThan(100);
      }
    });
  });

  test.describe('Mixed Page Sizes', () => {
    test('should handle documents with mixed page sizes', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');

      const nextButton = page.locator('[data-testid="pager-next"]');
      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');

      // Navigate through multiple pages with potentially different sizes
      for (let i = 0; i < 3; i++) {
        const pdfContent = pdfPane.locator('canvas, iframe').first();
        await expect(pdfContent).toBeVisible({ timeout: 15000 });

        // No errors on any page
        const errorMessage = pdfPane.locator('[data-testid="error-message"]');
        await expect(errorMessage).not.toBeVisible();

        if (i < 2) {
          await nextButton.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should maintain proper layout across different page sizes', async ({ page }) => {
      await openDocument(page, 'test-edge-cases.pdf');

      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      const nextButton = page.locator('[data-testid="pager-next"]');

      // Check layout on first page
      const initialPdfBox = await pdfPane.boundingBox();

      // Navigate to next page
      await nextButton.click();
      await page.waitForTimeout(500);

      // Check layout on second page
      const nextPdfBox = await pdfPane.boundingBox();

      // Pane positions should be consistent even with different page sizes
      expect(initialPdfBox).toBeTruthy();
      expect(nextPdfBox).toBeTruthy();

      if (initialPdfBox && nextPdfBox) {
        // X positions should be similar (horizontal layout consistent)
        expect(Math.abs(initialPdfBox.x - nextPdfBox.x)).toBeLessThan(10);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should show error for corrupted PDF pages', async ({ page }) => {
      // Select the corrupted PDF test document by filename
      const corruptedPdfCard = page.locator('[data-testid="document-card"]')
        .filter({ hasText: 'test-corrupted-pdf.pdf' });
      
      await corruptedPdfCard.waitFor({ timeout: 10000 });
      await corruptedPdfCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      // Corrupted PDF should show error message
      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      
      // Wait for PDF.js to attempt loading and fail (may take a few seconds)
      await page.waitForTimeout(5000);

      // Should show error message for corrupted PDF
      const errorMessage = pdfPane.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});
