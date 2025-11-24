import { test, expect } from '@playwright/test';

/**
 * E2E tests for mode switching (T098)
 * Tests FR-005: Two display modes (2-pane, 3-pane)
 * Tests FR-006: Mode switching without losing page position
 * Tests ModeToggle component integration
 */

test.describe('Mode Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Select a document with multiple languages (kombucha has en-US, es-ES, fr-FR)
    const documentCard = page.locator('[data-testid="document-card"]', {
      hasText: /kombucha/i,
    }).first();
    
    await documentCard.waitFor({ timeout: 10000 });
    await documentCard.click();

    // Wait for the viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
  });

  test.describe('Mode Toggle UI (FR-005)', () => {
    test('should display mode toggle buttons', async ({ page }) => {
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');

      await expect(twoPaneButton).toBeVisible();
      await expect(threePaneButton).toBeVisible();
    });

    test('should show 2-pane mode as active by default', async ({ page }) => {
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      
      await expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should enable 3-pane button when multiple languages available', async ({ page }) => {
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      
      await expect(threePaneButton).not.toBeDisabled();
    });

    test('should display view mode label', async ({ page }) => {
      await expect(page.locator('text="View:"')).toBeVisible();
    });
  });

  test.describe('Switching to 3-Pane Mode (FR-005)', () => {
    test('should switch from 2-pane to 3-pane mode', async ({ page }) => {
      // Verify starting in 2-pane mode (1 PDF + 1 markdown)
      const panesInTwoPane = page.locator('[data-pane-id]');
      await expect(panesInTwoPane).toHaveCount(2);

      // Click 3-pane button
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      await threePaneButton.click();

      // Wait for layout to update
      await page.waitForTimeout(500);

      // Verify now in 3-pane mode (1 PDF + 2 markdown)
      const panesInThreePane = page.locator('[data-pane-id]');
      await expect(panesInThreePane).toHaveCount(3);

      // Verify 3-pane button is now active
      await expect(threePaneButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should display PDF pane and two markdown panes in 3-pane mode', async ({ page }) => {
      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Check for PDF pane
      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      await expect(pdfPane).toBeVisible();

      // Check for two markdown panes
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      await expect(markdownPanes).toHaveCount(2);
    });

    test('should update URL with mode parameter', async ({ page }) => {
      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Check URL contains mode=three-pane
      const url = new URL(page.url());
      expect(url.searchParams.get('mode')).toBe('three-pane');
    });
  });

  test.describe('Switching Back to 2-Pane Mode (FR-005)', () => {
    test('should switch from 3-pane back to 2-pane mode', async ({ page }) => {
      // Switch to 3-pane first
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Verify in 3-pane
      let panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);

      // Switch back to 2-pane
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      await twoPaneButton.click();
      await page.waitForTimeout(500);

      // Verify back in 2-pane
      panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(2);

      // Verify 2-pane button is now active
      await expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should update URL to 2pane mode', async ({ page }) => {
      // Switch to 3-pane first
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Switch back to 2-pane
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);

      // Check URL contains mode=two-pane
      const url = new URL(page.url());
      expect(url.searchParams.get('mode')).toBe('two-pane');
    });
  });

  test.describe('Page Position Preservation (FR-006)', () => {
    test('should preserve page number when switching modes', async ({ page }) => {
      // Navigate to page 3
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(300);

      // Verify on page 3
      const pageInput = page.locator('[data-testid="pager-input"]');
      await expect(pageInput).toHaveValue('3');

      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);
      
      // Wait for pager to be available after mode switch
      await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });

      // Verify still on page 3
      await expect(pageInput).toHaveValue('3');

      // Switch back to 2-pane
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);
      
      // Wait for pager to be available after mode switch
      await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });

      // Verify still on page 3
      await expect(pageInput).toHaveValue('3');
    });

    test('should maintain page position through multiple mode switches', async ({ page }) => {
      // Navigate to page 5
      for (let i = 0; i < 4; i++) {
        await page.locator('[data-testid="pager-next"]').click();
        await page.waitForTimeout(200);
      }

      const pageInput = page.locator('[data-testid="pager-input"]');
      await expect(pageInput).toHaveValue('5');

      // Switch modes multiple times
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(300);
      await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });
      await expect(pageInput).toHaveValue('5');

      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(300);
      await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });
      await expect(pageInput).toHaveValue('5');

      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(300);
      await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });
      await expect(pageInput).toHaveValue('5');
    });
  });

  test.describe('URL Persistence', () => {
    test('should load in 3-pane mode when URL has mode=three-pane', async ({ page }) => {
      // Navigate directly with mode parameter
      await page.goto('/?mode=three-pane');

      // Select a document
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.waitFor({ timeout: 10000 });
      await firstCard.click();

      // Wait for viewer
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Verify in 3-pane mode
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      await expect(threePaneButton).toHaveAttribute('aria-pressed', 'true');

      // Verify 3 panes visible
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should load in 2-pane mode when URL has mode=two-pane', async ({ page }) => {
      // Navigate directly with mode parameter
      await page.goto('/?mode=two-pane');

      // Select a document
      const firstCard = page.locator('[data-testid="document-card"]').first();
      await firstCard.waitFor({ timeout: 10000 });
      await firstCard.click();

      // Wait for viewer
      await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });

      // Verify in 2-pane mode
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      await expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');

      // Verify 2 panes visible
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(2);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes on mode buttons', async ({ page }) => {
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');

      // Check aria-pressed
      await expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');
      await expect(threePaneButton).toHaveAttribute('aria-pressed', 'false');

      // Check aria-label
      await expect(twoPaneButton).toHaveAttribute('aria-label', 'Two pane mode');
      await expect(threePaneButton).toHaveAttribute('aria-label', 'Three pane mode');
    });

    test('should have role="group" on mode toggle container', async ({ page }) => {
      const modeToggleGroup = page.locator('[role="group"][aria-label="View mode selector"]');
      await expect(modeToggleGroup).toBeVisible();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Focus on 2-pane button
      await page.locator('[data-testid="two-pane-button"]').focus();

      // Press Tab to move to 3-pane button
      await page.keyboard.press('Tab');

      // Press Enter to activate
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify switched to 3-pane
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      await expect(threePaneButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid mode switching', async ({ page }) => {
      // Rapidly click between modes
      for (let i = 0; i < 5; i++) {
        await page.locator('[data-testid="three-pane-button"]').click();
        await page.waitForTimeout(100);
        await page.locator('[data-testid="two-pane-button"]').click();
        await page.waitForTimeout(100);
      }

      // Should end in stable state (2-pane)
      const twoPaneButton = page.locator('[data-testid="two-pane-button"]');
      await expect(twoPaneButton).toHaveAttribute('aria-pressed', 'true');

      // Panes should be consistent
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(2);
    });

    test('should maintain mode when navigating pages', async ({ page }) => {
      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Navigate to next page
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(500);

      // Verify still in 3-pane mode
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      await expect(threePaneButton).toHaveAttribute('aria-pressed', 'true');

      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should not break layout when switching at viewport edge', async ({ page }) => {
      // Set viewport to smaller size
      await page.setViewportSize({ width: 1024, height: 768 });

      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Verify panes are visible and not overlapping
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);

      // Check that all panes are within viewport
      for (let i = 0; i < 3; i++) {
        const pane = panes.nth(i);
        await expect(pane).toBeVisible();
      }
    });
  });
});
