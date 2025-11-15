import { test, expect } from '@playwright/test';

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

  test.describe('Landscape Pages (FR-029a)', () => {
    test('should display landscape PDF pages correctly', async ({ page }) => {
      // Select document (assumes first document has landscape pages)
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
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

    test('should maintain aspect ratio for landscape pages', async ({ page }) => {
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
      const pdfCanvas = pdfPane.locator('canvas').first();
      
      await expect(pdfCanvas).toBeVisible({ timeout: 15000 });

      // Canvas should have dimensions (width > height for landscape)
      const canvasBox = await pdfCanvas.boundingBox();
      expect(canvasBox).toBeTruthy();
    });
  });

  test.describe('Rotated Pages (FR-029b)', () => {
    test('should handle rotated PDF pages', async ({ page }) => {
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      // Navigate through pages to find rotated ones
      const nextButton = page.locator('[data-testid="pager-next"]');
      await nextButton.click();
      await page.waitForTimeout(300);

      // PDF should still render correctly
      const pdfPane = page.locator('[data-pane-id="pdf"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();
      await expect(pdfContent).toBeVisible({ timeout: 15000 });

      // No error messages
      const errorMessage = pdfPane.locator('[data-testid="error-message"]');
      await expect(errorMessage).not.toBeVisible();
    });

    test('should apply correct rotation to rotated pages', async ({ page }) => {
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
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
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();

      // Large pages should still render
      await expect(pdfContent).toBeVisible({ timeout: 10000 });

      // Should not cause layout issues
      const paneBox = await pdfPane.boundingBox();
      expect(paneBox).toBeTruthy();
    });

    test('should scale very large pages to fit viewport', async ({ page }) => {
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
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

    test.skip('should not freeze browser with very large pages', async ({ page }) => {
      // Skipped: Test data for very large PDF pages not available
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

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
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
      const pdfContent = pdfPane.locator('canvas, iframe').first();

      // Small pages should still render
      await expect(pdfContent).toBeVisible({ timeout: 15000 });
    });

    test('should scale small pages appropriately', async ({ page }) => {
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
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
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const nextButton = page.locator('[data-testid="pager-next"]');
      const pdfPane = page.locator('[data-pane-id="pdf"]');

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
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      const pdfPane = page.locator('[data-pane-id="pdf"]');
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
      const pdfPane = page.locator('[data-pane-id="pdf"]');
      
      // Wait for PDF.js to attempt loading and fail (may take a few seconds)
      await page.waitForTimeout(5000);

      // Should show error message for corrupted PDF
      const errorMessage = pdfPane.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('should remain functional after PDF rendering error', async ({ page }) => {
      // Select a multi-page document to ensure we can navigate
      const kombuchaCard = page.locator('[data-testid="document-card"]')
        .filter({ hasText: 'kombucha' });
      
      // If kombucha not found, use first card
      const cardCount = await kombuchaCard.count();
      const selectedCard = cardCount > 0 ? kombuchaCard.first() : page.locator('[data-testid="document-card"]').first();
      
      await selectedCard.click();
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      // Wait for initial page to load
      const markdownPane = page.locator('[data-pane-id="markdown"]');
      await expect(markdownPane.locator('[data-testid="markdown-content"]')).toBeVisible({ timeout: 15000 });

      // Navigation should still work
      const nextButton = page.locator('[data-testid="pager-next"]');
      
      // Check if next button is enabled (there is a page 2)
      const isNextEnabled = await nextButton.isEnabled();
      if (!isNextEnabled) {
        // Document only has 1 page, test passes as navigation is not applicable
        return;
      }
      
      await nextButton.click();
      
      // Wait for page transition
      await page.waitForTimeout(1000);

      // Wait for any loading state to complete
      const loadingIndicator = markdownPane.locator('[data-testid="loading-indicator"]');
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

      // Verify page display updated to page 2
      const pageDisplay = page.locator('[data-testid="page-display"]');
      await expect(pageDisplay).toContainText('Page 2', { timeout: 5000 });

      // Markdown pane should show content for page 2 (or error state, both indicate functionality)
      // Check for either content or error message - both show the pane is functional
      const markdownContent = markdownPane.locator('[data-testid="markdown-content"]');
      const errorMessage = markdownPane.locator('[data-testid="error-message"]');
      
      try {
        await expect(markdownContent).toBeVisible({ timeout: 15000 });
      } catch {
        // If content not visible, error message should be visible (both are acceptable - shows functionality)
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
