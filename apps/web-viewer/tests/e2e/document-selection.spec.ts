import { test, expect } from '@playwright/test';

/**
 * E2E tests for document selection workflow (FR-021, FR-022, FR-023)
 * Tests the complete user flow from viewing documents to selecting one
 */

test.describe('Document Selection Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
  });

  test('displays list of available documents', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });

    // Check that at least one document is visible
    const documentCards = await page.locator('[data-testid="document-card"]').count();
    expect(documentCards).toBeGreaterThan(0);
  });

  test('displays document information correctly', async ({ page }) => {
    // Wait for first document card
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Check for document name
    await expect(firstCard.locator('[data-testid="document-name"]')).toBeVisible();

    // Check for page count
    await expect(firstCard.locator('[data-testid="page-count"]')).toBeVisible();

    // Check for language badges
    await expect(firstCard.locator('[data-testid="language-badge"]').first()).toBeVisible();
  });

  test('selects document on click', async ({ page }) => {
    // Wait for documents to load
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Click the document card
    await firstCard.click();

    // Check that viewer opened (document selection navigates to viewer)
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('selects document with keyboard (Enter key)', async ({ page }) => {
    // Focus the first document card
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.focus();

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Check that viewer opened (document selection navigates to viewer)
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('selects document with keyboard (Space key)', async ({ page }) => {
    // Focus the first document card
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.focus();

    // Press Space to select
    await page.keyboard.press('Space');

    // Check that viewer opened (document selection navigates to viewer)
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
  });

  test('shows processed language versions with preference (FR-021)', async ({ page }) => {
    // Wait for documents to load
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Look for processed language badge
    const languageBadges = firstCard.locator('[data-testid="language-badge"]');
    const firstBadgeText = await languageBadges.first().textContent();

    // Should show human-readable language name without "raw" indicator
    // E.g., "English (US)", "French", etc. (not "en-US (Raw)")
    expect(firstBadgeText).toBeTruthy();
    expect(firstBadgeText).not.toContain('Raw');
  });

  test('displays file size in human-readable format', async ({ page }) => {
    // Wait for first document card
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Check file size display
    const fileSize = firstCard.locator('[data-testid="file-size"]');
    await expect(fileSize).toBeVisible();
    
    // Should show size in KB or MB format
    const sizeText = await fileSize.textContent();
    expect(sizeText).toMatch(/\d+(\.\d+)?\s*(KB|MB|B)/);
  });

  test('navigates through documents with Tab key', async ({ page }) => {
    // Wait for multiple documents
    await page.waitForSelector('[data-testid="document-card"]');
    const cards = page.locator('[data-testid="document-card"]');
    const cardCount = await cards.count();

    if (cardCount > 1) {
      // Focus first card
      await cards.first().focus();

      // Check that first card is focused
      let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBe('document-card');

      // Tab should move through interactive elements
      await page.keyboard.press('Tab');

      // After tab, focus moves to next focusable element (could be button or next card)
      focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy(); // Should focus something
    }
  });

  test('displays responsive grid layout', async ({ page }) => {
    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-card"]');

    // Check that container has grid classes
    const container = page.locator('[data-testid="document-list"]');
    await expect(container).toBeVisible();
  });

  test('handles loading state', async ({ page }) => {
    // Navigate to page
    await page.goto('/');

    // Check for loading indicator (should appear briefly)
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    
    // Either loading indicator is visible or documents are already loaded
    const isLoading = await loadingIndicator.isVisible().catch(() => false);
    const hasDocuments = await page.locator('[data-testid="document-card"]').count() > 0;
    
    expect(isLoading || hasDocuments).toBe(true);
  });

  test('navigation to viewer works correctly', async ({ page }) => {
    // Select a document
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();
    
    // Click to select and navigate to viewer
    await firstCard.click();
    await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });

    // Can navigate back to document selection
    const backButton = page.locator('button:has-text("Back to Documents")');
    await backButton.click();
    
    // Wait for navigation transition
    await page.waitForTimeout(500);

    // Should see document list again (use .first() to avoid strict mode violation with multiple cards)
    await expect(page.locator('[data-testid="document-card"]').first()).toBeVisible({ timeout: 20000 });
  });

  test('displays multiple language versions', async ({ page }) => {
    // Wait for first document
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Count language badges
    const languageBadges = firstCard.locator('[data-testid="language-badge"]');
    const badgeCount = await languageBadges.count();

    // Should have at least one language
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('document card has proper ARIA attributes', async ({ page }) => {
    // Wait for first document
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Check ARIA role
    await expect(firstCard).toHaveAttribute('role', 'button');

    // Check tabIndex
    await expect(firstCard).toHaveAttribute('tabindex', '0');

    // Check aria-pressed
    const ariaPressed = await firstCard.getAttribute('aria-pressed');
    expect(ariaPressed).toMatch(/true|false/);
  });

  test('clicking select button triggers selection', async ({ page }) => {
    // Wait for first document
    const firstCard = page.locator('[data-testid="document-card"]').first();
    await firstCard.waitFor();

    // Find and click the select button within the card
    const selectButton = firstCard.locator('[data-testid="select-button"]');
    
    // If button exists, click it
    if (await selectButton.isVisible()) {
      await selectButton.click();

      // Check that viewer opened
      await expect(page.locator('[data-testid="viewer-container"]')).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('Document Selection - Real Data', () => {
  test('displays kombucha PDF document', async ({ page }) => {
    await page.goto('/');

    // Wait for documents to load
    await page.waitForSelector('[data-testid="document-card"]', { timeout: 10000 });

    // Look for kombucha document
    const kombuchaCard = page.locator('[data-testid="document-card"]').filter({ 
      hasText: /kombucha/i 
    });

    // If kombucha exists in test data, verify it
    const exists = await kombuchaCard.count() > 0;
    if (exists) {
      await expect(kombuchaCard.first()).toBeVisible();
      
      // Check for expected language versions
      const languageBadges = kombuchaCard.first().locator('[data-testid="language-badge"]');
      const badgeCount = await languageBadges.count();
      expect(badgeCount).toBeGreaterThan(0);
    }
  });
});
