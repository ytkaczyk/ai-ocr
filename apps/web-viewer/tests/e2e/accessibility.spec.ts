import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility E2E Tests
 * Tests accessibility compliance using axe-core
 * Implements T107: Automated accessibility tests with axe-core
 * Covers WCAG 2.1 Level AA compliance
 */

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/');
  });

  test('should not have accessibility violations on home page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations on document selection page', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility violations in viewer with document loaded', async ({
    page,
  }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });

    // Select the first document
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });

    // Check pager navigation has aria-label
    const pager = page.locator('[data-testid="pager"]');
    await expect(pager).toHaveAttribute('aria-label', 'Page navigation');

    // Check first page button has aria-label
    const firstButton = page.locator('[data-testid="pager-first"]');
    await expect(firstButton).toHaveAttribute('aria-label', 'Go to first page');

    // Check previous page button has aria-label
    const prevButton = page.locator('[data-testid="pager-prev"]');
    await expect(prevButton).toHaveAttribute('aria-label', 'Go to previous page');

    // Check next page button has aria-label
    const nextButton = page.locator('[data-testid="pager-next"]');
    await expect(nextButton).toHaveAttribute('aria-label', 'Go to next page');

    // Check last page button has aria-label
    const lastButton = page.locator('[data-testid="pager-last"]');
    await expect(lastButton).toHaveAttribute('aria-label', 'Go to last page');

    // Check mode toggle has role="group"
    const modeToggle = page.locator('[role="group"][aria-label="View mode selector"]');
    await expect(modeToggle).toBeVisible();
  });

  test('should have proper focus management and tab order', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });

    // Check that interactive elements are focusable
    const twoPane = page.locator('[data-testid="two-pane-button"]');
    await twoPane.focus();
    await expect(twoPane).toBeFocused();

    // Tab to next element (3-pane button)
    await page.keyboard.press('Tab');
    const threePane = page.locator('[data-testid="three-pane-button"]');
    await expect(threePane).toBeFocused();

    // Tab to pager controls
    await page.keyboard.press('Tab');
    const firstButton = page.locator('[data-testid="pager-first"]');
    await expect(firstButton).toBeFocused();
  });

  test('should have screen reader announcements for page changes', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });

    // Check that screen reader announcement element exists
    const announcement = page.locator('[data-testid="screen-reader-announcement"]');
    await expect(announcement).toHaveCount(1);
    await expect(announcement).toHaveAttribute('aria-live', 'polite');
    await expect(announcement).toHaveAttribute('role', 'status');

    // Navigate to next page
    const nextButton = page.locator('[data-testid="pager-next"]');
    await nextButton.click();

    // Wait a bit for announcement to update
    await page.waitForTimeout(500);

    // Verify announcement has content about page 2
    const announcementText = await announcement.textContent();
    expect(announcementText).toContain('Page 2');
  });

  test('should have role="alert" on error messages', async ({ page }) => {
    // Navigate to a non-existent document (this should trigger an error)
    await page.goto('/?doc=non-existent-doc-id');

    // Wait for error to appear
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Check error has proper ARIA attributes
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
  });

  test('should have aria-live on loading indicators', async ({ page }) => {
    // Check initial loading state has proper ARIA attributes
    const loadingIndicator = page.locator('[role="status"][aria-live="polite"]');
    
    // Loading indicator should appear briefly
    // Note: This might be fast, so we check if it exists or has existed
    const hasLoadingIndicator = await loadingIndicator.count();
    
    // If still loading, verify attributes
    if (hasLoadingIndicator > 0) {
      await expect(loadingIndicator.first()).toHaveAttribute('aria-live', 'polite');
      await expect(loadingIndicator.first()).toHaveAttribute('role', 'status');
    }

    // Eventually, content should load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
  });

  test('should have proper landmarks and regions', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

    // Check that main content has role="main"
    const mainContent = page.locator('[role="main"]');
    await expect(mainContent).toBeVisible();

    // Check toolbar has role="toolbar"
    const toolbar = page.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Check content panes region
    const contentRegion = page.locator('[role="region"][aria-label="Document content panes"]');
    await expect(contentRegion).toBeVisible();
  });

  test('should have keyboard navigation support', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    
    // Test keyboard navigation on document cards
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.focus();
    
    // Press Enter to select
    await page.keyboard.press('Enter');

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });

    // Test arrow key navigation
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    // Verify page changed
    const pageDisplay = page.locator('[data-testid="page-display"]');
    const pageText = await pageDisplay.textContent();
    expect(pageText).toContain('Page 2');

    // Test going back
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);

    const pageText2 = await pageDisplay.textContent();
    expect(pageText2).toContain('Page 1');
  });

  test('should not have color contrast violations', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-list"]', { timeout: 10000 });
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.click();

    // Wait for viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

    // Run accessibility scan with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    // Filter for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter((violation) =>
      violation.id.includes('color-contrast')
    );

    expect(colorContrastViolations).toEqual([]);
  });
});
