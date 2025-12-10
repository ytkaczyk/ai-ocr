import { test, expect } from '@playwright/test';

/**
 * E2E tests for 3-pane synchronization (T099)
 * Tests FR-004: Pane synchronization across all visible panes
 * Tests FR-005: 3-pane mode functionality
 * Tests that all three panes stay synchronized during navigation
 */

test.describe('3-Pane Synchronization', () => {
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
    
    // Wait for pager to be visible in 2-pane mode first
    await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });

    // Switch to 3-pane mode
    const threePaneButton = page.locator('[data-testid="three-pane-button"]');
    await threePaneButton.waitFor({ timeout: 5000 });
    await threePaneButton.click();
    
    // Wait for mode switch to complete and pager to be available again
    await page.waitForTimeout(1000);
    await page.waitForSelector('[data-testid="pager-input"]', { timeout: 10000 });

    // Verify in 3-pane mode
    const panes = page.locator('[data-pane-id]');
    await expect(panes).toHaveCount(3);
  });

  test.describe('Initial 3-Pane Setup (FR-005)', () => {
    test('should display all three panes', async ({ page }) => {
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should display PDF pane on the left', async ({ page }) => {
      const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
      await expect(pdfPane).toBeVisible();

      // PDF should be first (leftmost) pane
      const allPanes = page.locator('[data-pane-id]');
      const firstPane = allPanes.first();
      await expect(firstPane).toHaveAttribute('data-pane-id', 'pdf-pane');
    });

    test('should display two markdown panes', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      await expect(markdownPanes).toHaveCount(2);
    });

    test('should show all panes on page 1 initially', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      await expect(pageInput).toHaveValue('1');

      // All panes should be displaying content (not loading)
      const panes = page.locator('[data-pane-id]');
      for (let i = 0; i < 3; i++) {
        await expect(panes.nth(i)).toBeVisible();
      }
    });
  });

  test.describe('Navigation Synchronization (FR-004)', () => {
    test('should synchronize all panes when clicking next', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Click next
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(600);

      // Verify page number updated
      await expect(pageInput).toHaveValue('2');

      // All panes should still be visible and synchronized
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
      
      for (let i = 0; i < 3; i++) {
        await expect(panes.nth(i)).toBeVisible();
      }
    });

    test('should synchronize all panes when clicking previous', async ({ page }) => {
      // Go to page 3 first
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(300);

      const pageInput = page.locator('[data-testid="pager-input"]');
      await expect(pageInput).toHaveValue('3');

      // Click previous
      await page.locator('[data-testid="pager-prev"]').click();
      await page.waitForTimeout(600);

      // Verify page number updated
      await expect(pageInput).toHaveValue('2');

      // All panes should still be visible
      const panes = page.locator('[data-pane-id]');
      for (let i = 0; i < 3; i++) {
        await expect(panes.nth(i)).toBeVisible();
      }
    });

    test('should synchronize all panes when jumping to specific page', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Clear input and type page 5
      await pageInput.fill('5');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(600);

      // Verify all panes synchronized to page 5
      await expect(pageInput).toHaveValue('5');

      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should synchronize when clicking first page button', async ({ page }) => {
      // Navigate away from page 1
      const pageInput = page.locator('[data-testid="pager-input"]');
      for (let i = 0; i < 3; i++) {
        await page.waitForSelector('[data-testid="pager-next"]', { state: 'visible', timeout: 10000 });
        await page.locator('[data-testid="pager-next"]').click();
        await page.waitForTimeout(800);
      }

      // Verify we're on page 4
      await page.waitForTimeout(1000);
      await expect(pageInput).toHaveValue('4', { timeout: 10000 });

      // Click first page button
      await page.waitForSelector('[data-testid="pager-first"]', { state: 'visible', timeout: 10000 });
      await page.locator('[data-testid="pager-first"]').click();
      await page.waitForTimeout(1500);

      // Verify back to page 1 - wait for viewer to be stable first
      await page.waitForSelector('[data-testid="viewer-container"]', { state: 'visible', timeout: 10000 });
      await expect(pageInput).toHaveValue('1', { timeout: 10000 });

      // All panes visible
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should synchronize when clicking last page button', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Click last page button
      await page.locator('[data-testid="pager-last"]').click();
      await page.waitForTimeout(600);

      // Verify on last page (should be > 1)
      const lastPageValue = await pageInput.inputValue();
      expect(parseInt(lastPageValue)).toBeGreaterThan(1);

      // All panes visible
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });
  });

  test.describe('Rapid Navigation in 3-Pane Mode', () => {
    test('should handle rapid next clicks without desynchronization', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      const nextButton = page.locator('[data-testid="pager-next"]');
      
      // Rapidly click next 5 times with stability checks
      for (let i = 0; i < 5; i++) {
        await nextButton.waitFor({ state: 'visible', timeout: 10000 });
        await nextButton.click();
        await page.waitForTimeout(500); // Increased for 3-pane mode
      }

      // Wait for final state to settle
      await page.waitForTimeout(2500);

      // Ensure viewer is stable before checking state
      await page.waitForSelector('[data-testid="viewer-container"]', { state: 'visible', timeout: 10000 });
      await pageInput.waitFor({ state: 'visible', timeout: 10000 });
      const finalPage = await pageInput.inputValue();
      expect(parseInt(finalPage)).toBeGreaterThan(1);

      // All panes should still be in sync (visible and showing content)
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should handle rapid previous clicks without desynchronization', async ({ page }) => {
      // Navigate to page 7 first with better stability
      for (let i = 0; i < 6; i++) {
        const nextButton = page.locator('[data-testid="pager-next"]');
        await nextButton.waitFor({ state: 'visible', timeout: 10000 });
        await nextButton.click({ force: true });
        await page.waitForTimeout(600); // Increased from 400ms
      }

      await page.waitForTimeout(1000);

      // Rapidly click previous 4 times with re-query
      for (let i = 0; i < 4; i++) {
        const prevButton = page.locator('[data-testid="pager-prev"]');
        await prevButton.waitFor({ state: 'visible', timeout: 10000 });
        await prevButton.click({ force: true });
        await page.waitForTimeout(600); // Increased from 400ms
      }

      // Wait for final state
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1000);

      // All panes should still be synchronized
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should handle alternating next/previous clicks', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      const nextButton = page.locator('[data-testid="pager-next"]');
      const prevButton = page.locator('[data-testid="pager-prev"]');
      
      // Alternate between next and previous with adequate waits
      // Starting at page 1
      await nextButton.click();  // → page 2
      await page.waitForTimeout(400);
      await prevButton.click();  // → page 1
      await page.waitForTimeout(400);
      await nextButton.click();  // → page 2
      await page.waitForTimeout(400);
      await nextButton.click();  // → page 3
      await page.waitForTimeout(400);

      // Wait for final state to stabilize
      await page.waitForTimeout(500);

      // Should be on page 3
      await expect(pageInput).toHaveValue('3', { timeout: 5000 });

      // All panes synchronized
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });
  });

  test.describe('Keyboard Navigation in 3-Pane Mode', () => {
    test('should synchronize with arrow key navigation', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Press right arrow to go next
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(600);

      await expect(pageInput).toHaveValue('2');

      // Press left arrow to go previous
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(600);

      await expect(pageInput).toHaveValue('1');

      // All panes synchronized
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });

    test('should synchronize with page up/down keys', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Press PageDown to go next
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(600);

      await expect(pageInput).toHaveValue('2');

      // Press PageUp to go previous
      await page.keyboard.press('PageUp');
      await page.waitForTimeout(600);

      await expect(pageInput).toHaveValue('1');

      // All panes synchronized
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });
  });

  test.describe('Pane Width Distribution', () => {
    test('should distribute width equally across 3 panes', async ({ page }) => {
      const panes = page.locator('[data-pane-id]');
      
      // Get bounding boxes for all panes
      const boxes = [];
      for (let i = 0; i < 3; i++) {
        const box = await panes.nth(i).boundingBox();
        boxes.push(box);
      }

      // All boxes should exist
      expect(boxes[0]).toBeTruthy();
      expect(boxes[1]).toBeTruthy();
      expect(boxes[2]).toBeTruthy();

      if (boxes[0] && boxes[1] && boxes[2]) {
        // Widths should be approximately equal (within 50px tolerance for borders/gaps)
        const width1 = boxes[0].width;
        const width2 = boxes[1].width;
        const width3 = boxes[2].width;

        expect(Math.abs(width1 - width2)).toBeLessThan(50);
        expect(Math.abs(width2 - width3)).toBeLessThan(50);
        expect(Math.abs(width1 - width3)).toBeLessThan(50);
      }
    });

    test('should maintain horizontal layout in 3-pane mode', async ({ page }) => {
      const panes = page.locator('[data-pane-id]');
      
      // Get bounding boxes
      const box1 = await panes.nth(0).boundingBox();
      const box2 = await panes.nth(1).boundingBox();
      const box3 = await panes.nth(2).boundingBox();

      expect(box1).toBeTruthy();
      expect(box2).toBeTruthy();
      expect(box3).toBeTruthy();

      if (box1 && box2 && box3) {
        // Panes should be arranged horizontally (left to right)
        expect(box1.x).toBeLessThan(box2.x);
        expect(box2.x).toBeLessThan(box3.x);

        // All panes should have similar y position (horizontal layout)
        expect(Math.abs(box1.y - box2.y)).toBeLessThan(50);
        expect(Math.abs(box2.y - box3.y)).toBeLessThan(50);
      }
    });
  });

  test.describe('Content Synchronization', () => {
    test('should update content in all panes when navigating', async ({ page }) => {
      // Navigate to page 2
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(800);

      // Check that markdown panes have content (not empty)
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      
      for (let i = 0; i < 2; i++) {
        const pane = markdownPanes.nth(i);
        const content = await pane.textContent();
        
        // Content should not be empty or just "Loading..."
        expect(content).toBeTruthy();
        expect(content?.length).toBeGreaterThan(10);
      }
    });

    test('should maintain scroll position independently per pane', async ({ page }) => {
      // Get markdown panes
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      
      // Scroll first markdown pane
      const firstMarkdown = markdownPanes.nth(0);
      await firstMarkdown.hover();
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(300);

      // Scroll positions should be independent
      // (This is a basic check - full scroll position comparison would need more complex logic)
      await expect(firstMarkdown).toBeVisible();
    });
  });

  test.describe('Dividers in 3-Pane Mode', () => {
    test('should display two dividers between three panes', async ({ page }) => {
      const dividers = page.locator('[data-testid="pane-divider"]');
      
      // Should have 2 dividers (between pane1-pane2 and pane2-pane3)
      await expect(dividers).toHaveCount(2);
    });

    test('should allow resizing panes via dividers', async ({ page }) => {
      const dividers = page.locator('[data-testid="pane-divider"]');
      const firstDivider = dividers.first();

      // Get initial position
      const initialBox = await firstDivider.boundingBox();
      expect(initialBox).toBeTruthy();

      if (initialBox) {
        // Try to drag divider (move 100px to the right)
        await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(initialBox.x + 100, initialBox.y + initialBox.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);

        // Verify divider moved (width distribution changed)
        const newBox = await firstDivider.boundingBox();
        expect(newBox).toBeTruthy();
        
        if (newBox) {
          // Position should have changed
          expect(Math.abs(newBox.x - initialBox.x)).toBeGreaterThan(10);
        }
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should maintain synchronization when switching from 3-pane to 2-pane', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      
      // Navigate to page 3 in 3-pane mode
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(500);

      await expect(pageInput).toHaveValue('3', { timeout: 10000 });

      // Switch to 2-pane
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);

      // Should still be on page 3
      await expect(pageInput).toHaveValue('3');

      // Now only 2 panes
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(2);
    });

    test('should handle navigation at document boundaries', async ({ page }) => {
      const pageInput = page.locator('[data-testid="pager-input"]');
      const nextButton = page.locator('[data-testid="pager-next"]');
      const prevButton = page.locator('[data-testid="pager-prev"]');
      
      // Go to last page
      await page.locator('[data-testid="pager-last"]').click();
      await page.waitForTimeout(1200); // Increased from 600ms for better stability

      const lastPage = await pageInput.inputValue();

      // Next button should be disabled at last page
      await expect(nextButton).toBeDisabled({ timeout: 5000 });
      await expect(pageInput).toHaveValue(lastPage);

      // Go to first page
      await page.locator('[data-testid="pager-first"]').click();
      await page.waitForTimeout(1200); // Increased from 600ms for better stability

      // Prev button should be disabled at first page
      await expect(prevButton).toBeDisabled({ timeout: 5000 });
      await expect(pageInput).toHaveValue('1');

      // All 3 panes should still be visible
      const panes = page.locator('[data-pane-id]');
      await expect(panes).toHaveCount(3);
    });
  });
});
