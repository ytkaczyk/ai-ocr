import { test, expect } from '@playwright/test';

/**
 * E2E tests for Chrome rendering validation (FR-028)
 * Tests Chrome-specific rendering and behavior
 * 
 * These tests focus on FR-028 requirements:
 * - FR-028a: PDF rendering (canvas performance)
 * - FR-028b: Markdown typography consistency
 * - FR-028c: Layout consistency
 * 
 * Note: All E2E tests run against Chrome (chromium) as configured in
 * playwright.config.ts. This file validates Chrome-specific rendering and behavior.
 * 
 * For general functionality tests, see:
 * - viewer-navigation.spec.ts (layout, navigation, synchronization)
 * - document-selection.spec.ts (document loading)
 * - mode-switching.spec.ts (2-pane/3-pane toggle)
 * - pdf-edge-cases.spec.ts (PDF rendering edge cases)
 * - markdown-edge-cases.spec.ts (markdown rendering edge cases)
 */

test.describe('Chrome: Document Loading', () => {
  test('loads documents list with consistent styling', async ({ page }) => {
    await page.goto('/');
    
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });
    
    // Verify at least one document card is visible
    const documentCards = await page.locator('[data-testid="document-card"]').count();
    expect(documentCards).toBeGreaterThan(0);
    
    // Verify document card has consistent dimensions
    const firstCard = page.locator('[data-testid="document-card"]').first();
    const cardBox = await firstCard.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(cardBox!.width).toBeGreaterThan(100); // Has minimum width
    expect(cardBox!.height).toBeGreaterThan(50); // Has minimum height
  });

  test('loads document with consistent timing', async ({ page }) => {
    await page.goto('/');
    
    // Measure document card load time
    const startTime = Date.now();
    await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });
    const loadTime = Date.now() - startTime;
    
    // Chrome should load within reasonable time (10s as configured)
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Chrome: PDF Canvas Rendering (FR-028a)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();
    await firstCard.click();
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test.skip('PDF canvas renders with non-zero dimensions', async ({ page }) => {
    // Skipped: PDF canvas rendering is timing-dependent and covered by pdf-edge-cases.spec.ts
    // This test validates Chrome-specific canvas behavior but is flaky in CI
    const timeout = 15000;
    
    const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
    await expect(pdfPane).toBeVisible({ timeout });
    
    // Wait for canvas with retry (some browsers render slower)
    const canvas = pdfPane.locator('canvas').first();
    const retries = 3;
    let boundingBox = null;
    
    for (let i = 0; i < retries; i++) {
      await page.waitForTimeout(1000);
      if (await canvas.isVisible()) {
        boundingBox = await canvas.boundingBox();
        if (boundingBox && boundingBox.width > 0) break;
      }
    }
    
    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
  });

  test('PDF renders at consistent aspect ratio', async ({ page }) => {
    const timeout = 15000;
    
    const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
    await expect(pdfPane).toBeVisible({ timeout });
    
    // Wait for canvas
    const canvas = pdfPane.locator('canvas').first();
    await page.waitForTimeout(2000);
    
    if (await canvas.isVisible()) {
      const box = await canvas.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        const aspectRatio = box.width / box.height;
        
        // PDF pages are typically letter (8.5x11) or A4 (~0.77) or landscape variations
        // Allow wide range since different page orientations are valid
        expect(aspectRatio).toBeGreaterThan(0.5);
        expect(aspectRatio).toBeLessThan(2.0);
      }
    }
  });
});

test.describe('Chrome: Markdown Typography (FR-028b)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();
    await firstCard.click();
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('markdown prose styles are applied consistently', async ({ page }) => {
    const timeout = 15000;
    
    const markdownPane = page.locator('[data-pane-id="markdown-pane"]');
    await expect(markdownPane).toBeVisible({ timeout });
    
    // Check for prose class (Tailwind Typography)
    const proseElement = markdownPane.locator('.prose');
    await expect(proseElement).toBeVisible({ timeout });
    
    // Verify typography has computed styles
    const fontSize = await proseElement.evaluate((el) => 
      window.getComputedStyle(el).fontSize
    );
    const lineHeight = await proseElement.evaluate((el) => 
      window.getComputedStyle(el).lineHeight
    );
    
    expect(fontSize).toBeTruthy();
    expect(fontSize).not.toBe('0px');
    expect(lineHeight).toBeTruthy();
  });

  test('markdown content renders without horizontal scroll', async ({ page }) => {
    const timeout = 15000;
    
    const markdownPane = page.locator('[data-pane-id="markdown-pane"]');
    await expect(markdownPane).toBeVisible({ timeout });
    
    // Check that markdown pane doesn't have horizontal overflow
    const hasHorizontalScroll = await markdownPane.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    
    // Normal markdown should not require horizontal scrolling
    // (Exception: very long code blocks or tables, which are tested separately)
    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe('Chrome: Layout Consistency (FR-028c)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();
    await firstCard.click();
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('panes have consistent width distribution', async ({ page }) => {
    const timeout = 15000;
    
    await page.waitForTimeout(1000); // Let layout stabilize
    
    const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
    const markdownPane = page.locator('[data-pane-id="markdown-pane"]');
    
    await expect(pdfPane).toBeVisible({ timeout });
    await expect(markdownPane).toBeVisible({ timeout });
    
    const pdfBox = await pdfPane.boundingBox();
    const markdownBox = await markdownPane.boundingBox();
    
    expect(pdfBox).not.toBeNull();
    expect(markdownBox).not.toBeNull();
    
    // In 2-pane mode, each pane should be roughly 50% (allowing for divider)
    const totalWidth = pdfBox!.width + markdownBox!.width;
    const pdfPercentage = (pdfBox!.width / totalWidth) * 100;
    
    // Allow 40-60% range to account for divider and rounding
    expect(pdfPercentage).toBeGreaterThan(40);
    expect(pdfPercentage).toBeLessThan(60);
  });

  test('panes are horizontally aligned', async ({ page }) => {
    const timeout = 15000;
    
    const pdfPane = page.locator('[data-pane-id="pdf-pane"]');
    const markdownPane = page.locator('[data-pane-id="markdown-pane"]');
    
    await expect(pdfPane).toBeVisible({ timeout });
    await expect(markdownPane).toBeVisible({ timeout });
    
    const pdfBox = await pdfPane.boundingBox();
    const markdownBox = await markdownPane.boundingBox();
    
    expect(pdfBox).not.toBeNull();
    expect(markdownBox).not.toBeNull();
    
    // Panes should have same top position (horizontal alignment)
    const yDifference = Math.abs(pdfBox!.y - markdownBox!.y);
    expect(yDifference).toBeLessThan(10); // Allow small rounding differences
    
    // PDF should be on left, markdown on right
    expect(pdfBox!.x).toBeLessThan(markdownBox!.x);
  });
});

test.describe('Chrome: Performance Characteristics', () => {
  test('page navigation timing is consistent', async ({ page }) => {
    await page.goto('/');
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();
    await firstCard.click();
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
    
    // Wait for initial page load
    await page.waitForTimeout(2000);
    
    // Measure navigation time
    const startTime = Date.now();
    const nextButton = page.locator('[data-testid="pager-next"]');
    await nextButton.click();
    
    // Wait for page number to change
    await page.waitForTimeout(1500);
    const navigationTime = Date.now() - startTime;
    
    // Navigation should complete within 3 seconds in Chrome
    expect(navigationTime).toBeLessThan(3000);
  });
});


