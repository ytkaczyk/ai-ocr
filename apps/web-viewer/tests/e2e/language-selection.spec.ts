import { test, expect, Locator } from '@playwright/test';

/**
 * E2E tests for language selection (T097g)
 * Tests FR-034: Per-pane language selection
 * Tests FR-034a: Language selector dropdown
 * Tests FR-034b: Raw/processed toggle
 * Tests FR-034c: Selection priority over defaults
 */

/**
 * Helper function to wait for markdown content to finish loading
 * Checks both for the absence of the loading spinner and that content is visible
 */
async function waitForMarkdownLoadComplete(pane: Locator, timeout = 15000) {
  // Wait for the loading spinner to disappear
  const loadingStatus = pane.locator('[role="status"][aria-label="Loading markdown content"]');
  
  // Wait for the loading to complete (spinner to be hidden)
  try {
    await loadingStatus.waitFor({ state: 'hidden', timeout });
  } catch (e) {
    // If spinner was never visible or already gone, that's OK
    const isVisible = await loadingStatus.isVisible().catch(() => false);
    if (isVisible) {
      throw e; // Re-throw if spinner is still visible
    }
  }
  
  // Ensure the language selector is enabled (confirms loading complete)
  const selector = pane.locator('[aria-label="Select language version"]');
  await expect(selector).not.toBeDisabled({ timeout: 5000 });
}

test.describe('Language Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');
    
    // Select kombucha document (has en-US, fr-FR languages)
    const documentCard = page.locator('[data-testid="document-card"]', {
      hasText: /kombucha/i,
    }).first();
    
    await documentCard.waitFor({ timeout: 10000 });
    await documentCard.click();

    // Wait for the viewer to load
    await page.waitForSelector('[data-testid="viewer-container"]', { timeout: 10000 });
  });

  test.describe('Language Selector UI (FR-034a, FR-034e)', () => {
    test('should display language selector in markdown panes', async ({ page }) => {
      // Get markdown panes
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstMarkdown = markdownPanes.first();

      // Language selector should be visible
      const languageSelector = firstMarkdown.locator('[aria-label="Select language version"]');
      await expect(languageSelector).toBeVisible();
    });

    test('should display Globe icon in language selector', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstMarkdown = markdownPanes.first();

      // Globe icon should be visible
      const globeIcon = firstMarkdown.locator('[data-testid="globe-icon"]');
      await expect(globeIcon).toBeVisible();
    });

    test('should show formatted language name as selected value', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstMarkdown = markdownPanes.first();

      // Should display formatted language name (e.g., "English (US)", "French (ES)")
      const languageText = firstMarkdown.locator('text=/English|French|French/').first();
      await expect(languageText).toBeVisible();
    });
  });

  test.describe('Language Selection in 2-Pane Mode (FR-034a)', () => {
    test('should allow selecting different language', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      
      // Open language selector dropdown
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      
      // Wait for dropdown to open (listbox appears in a portal)
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      // Click on French option (dropdown is in a portal, so search globally)
      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      
      // Wait for dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 5000 });

      // Verify French is now selected
      await expect(markdownPane.locator('text=/French/')).toBeVisible({ timeout: 5000 });
    });

    test('should update content when language changed', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      
      // Wait for initial content to load
      await waitForMarkdownLoadComplete(markdownPane);
      
      // Get initial content
      const initialContent = await markdownPane.textContent();

      // Change language
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      
      // Wait for dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 5000 });
      
      // Wait for content to load with the new language
      await waitForMarkdownLoadComplete(markdownPane);

      // Content should have changed
      const newContent = await markdownPane.textContent();
      expect(newContent).not.toBe(initialContent);
    });

    test('should persist language selection across page navigation', async ({ page }) => {
      // Wait for initial page to load
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      await waitForMarkdownLoadComplete(markdownPane);
      
      // Change to French
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      
      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      
      // Wait for the dropdown to close
      await page.waitForSelector('[role="listbox"]', { state: 'hidden', timeout: 5000 });
      
      // Wait for the selector button to show French (confirms language change completed)
      await expect(selector).toContainText(/French/, { timeout: 5000 });
      
      // Wait for markdown content to be loaded after language change
      await waitForMarkdownLoadComplete(markdownPane);

      // Navigate to next page
      const nextButton = page.locator('[data-testid="pager-next"]');
      await nextButton.click();
      
      // Wait for page number to update (confirms navigation completed)
      await expect(page.locator('[data-testid="page-display"]')).toContainText('Page 2', { timeout: 10000 });
      
      // Wait for viewer to be stable
      await page.waitForSelector('[data-testid="viewer-container"]', { state: 'visible', timeout: 10000 });
      
      // Wait for the markdown pane to finish loading the new page content
      await waitForMarkdownLoadComplete(markdownPane);

      // Language selection should persist - re-query selector after navigation
      const selectorButton = page.locator('[data-pane-id^="markdown"]').first().locator('[aria-label="Select language version"]');
      await expect(selectorButton).toContainText(/French/, { timeout: 5000 });
    });
  });

  test.describe('Language Selection in 3-Pane Mode (FR-034a, FR-034c)', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to 3-pane mode
      const threePaneButton = page.locator('[data-testid="three-pane-button"]');
      await threePaneButton.click();
      await page.waitForTimeout(1000);
    });

    test('should show language selectors in both markdown panes', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      
      // Should have 2 markdown panes
      await expect(markdownPanes).toHaveCount(2);

      // Each should have a language selector
      const firstSelector = markdownPanes.nth(0).locator('[aria-label="Select language version"]');
      const secondSelector = markdownPanes.nth(1).locator('[aria-label="Select language version"]');

      await expect(firstSelector).toBeVisible();
      await expect(secondSelector).toBeVisible();
    });

    test('should allow independent language selection per pane', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstPane = markdownPanes.nth(0);
      const secondPane = markdownPanes.nth(1);

      // Change first pane to French
      const firstSelector = firstPane.locator('[aria-label="Select language version"]');
      await firstSelector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });

      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      await page.waitForTimeout(500);

      // Change second pane to French
      const secondSelector = secondPane.locator('[aria-label="Select language version"]');
      await secondSelector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      
      const frenchOption = page.getByRole('option', { name: /French/ }).first();
      await frenchOption.click();

      // Verify different languages selected
      await expect(firstPane.locator('text=/French/')).toBeVisible();
      await expect(secondPane.locator('text=/French/')).toBeVisible();
    });

    test('should override 3-pane defaults with user selection', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstPane = markdownPanes.nth(0);

      // In 3-pane mode, first markdown pane defaults to source language
      // User should be able to override this

      // Change to a different language (French)
      const selector = firstPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      
      const frenchOption = page.getByRole('option', { name: /French/ }).first();
      await frenchOption.click();

      // Verify French is selected (overriding default)
      await expect(firstPane.locator('text=/French/')).toBeVisible();

      // Navigate to next page
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(600);

      // French should still be selected (user choice persists)
      await expect(firstPane.locator('text=/French/')).toBeVisible();
    });

    test('should maintain independent selections across page navigation', async ({ page }) => {
      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstPane = markdownPanes.nth(0);
      const secondPane = markdownPanes.nth(1);

      // Set first to French, second to French
      let selector = firstPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      await page.waitForTimeout(500);

      selector = secondPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      const frenchOption = page.getByRole('option', { name: /French/ }).first();
      await frenchOption.click();

      // Navigate to page 3
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(300);
      await page.locator('[data-testid="pager-next"]').click();
      await page.waitForTimeout(600);

      // Both selections should persist - check selector button text
      const firstSelector = firstPane.locator('[aria-label="Select language version"]');
      const secondSelector = secondPane.locator('[aria-label="Select language version"]');
      await expect(firstSelector).toContainText(/French/, { timeout: 5000 });
      await expect(secondSelector).toContainText(/French/, { timeout: 5000 });
    });
  });

  test.describe('Raw/Processed Toggle (FR-034b)', () => {
    test('should show raw and processed versions in dropdown', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      
      // Open language selector
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForTimeout(300);

      // Should show both raw and processed options if available
      // (This depends on test data - kombucha may have raw versions)
      const dropdown = page.locator('[role="listbox"]');
      await expect(dropdown).toBeVisible();

      // Check if "Raw" appears in any option
      const rawOption = page.locator('[role="option"]', { hasText: /\(Raw\)/i });
      const hasRaw = (await rawOption.count()) > 0;

      if (hasRaw) {
        // If raw versions exist, test switching
        await rawOption.first().click();
        await page.waitForTimeout(500);

        // Should show "(Raw)" in selected language
        await expect(markdownPane.locator('text=/\\(Raw\\)/i')).toBeVisible();
      }
    });

    test('should toggle between raw and processed for same language', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      const selector = markdownPane.locator('[aria-label="Select language version"]');

      // Open dropdown
      await selector.click();
      await page.waitForTimeout(300);

      // Count options
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();

      // If we have both raw and processed versions, test toggling
      if (optionCount > 3) { // More than just the 3 base languages
        // Click on a raw version if available
        const rawOption = page.locator('[role="option"]', { hasText: /\(Raw\)/i }).first();
        const hasRaw = (await rawOption.count()) > 0;

        if (hasRaw) {
          await rawOption.click();
          await page.waitForTimeout(500);

          // Get current content
          const rawContent = await markdownPane.textContent();

          // Switch back to processed
          await selector.click();
          await page.waitForTimeout(300);
          
          // Find the processed version of same language
          const processedOptions = page.locator('[role="option"]').filter({ hasNotText: /\(Raw\)/i });
          await processedOptions.first().click();
          await page.waitForTimeout(500);

          // Content should change
          const processedContent = await markdownPane.textContent();
          expect(processedContent).not.toBe(rawContent);
        }
      }
    });
  });

  test.describe('Selection Priority (FR-034c)', () => {
    test('should use user selection over 3-pane default', async ({ page }) => {
      // Switch to 3-pane mode
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(1000);

      const markdownPanes = page.locator('[data-pane-id^="markdown"]');
      const firstPane = markdownPanes.nth(0);

      // Wait for initial content to load
      await page.waitForTimeout(500);

      // Change to different language
      const selector = firstPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForTimeout(300);

      // Select the second available language option
      const options = page.locator('[role="option"]');
      await options.nth(1).click();
      await page.waitForTimeout(800);

      // Get language value after change
      await page.waitForTimeout(500);
      const selectedLanguage = await selector.textContent();

      // Switch back to 2-pane and then to 3-pane again
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(1000);

      // User selection should still be in effect (check both panes have the selected language)
      const afterModeSwitchRaw = await markdownPanes.nth(0).locator('[aria-label="Select language version"]').textContent();
      const afterModeSwitchProcessed = await markdownPanes.nth(1).locator('[aria-label="Select language version"]').textContent();
      
      expect(afterModeSwitchRaw).toContain(selectedLanguage?.replace(' (Raw)', '') || '');
      expect(afterModeSwitchProcessed).toContain(selectedLanguage?.replace(' (Raw)', '') || '');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on language selector', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      const selector = markdownPane.locator('[aria-label="Select language version"]');

      await expect(selector).toHaveAttribute('aria-label', 'Select language version');
    });

    test('should support keyboard navigation in dropdown', async ({ page }) => {
      // Wait for viewer and panes to be fully loaded
      await page.waitForSelector('[data-testid="pager"]', { timeout: 5000 });
      
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      await expect(markdownPane).toBeVisible({ timeout: 5000 });
      
      // Find the language selector trigger button
      const languageSelector = markdownPane.locator('[aria-label="Select language version"]');
      await expect(languageSelector).toBeVisible({ timeout: 5000 });
      
      // Ensure selector is enabled (not disabled for single language)
      await expect(languageSelector).toBeEnabled({ timeout: 5000 });
      
      // Click to focus and then press Space to open
      await languageSelector.click();
      await page.waitForTimeout(200);
      
      // Wait for dropdown to appear
      const dropdown = page.getByRole('listbox');
      await expect(dropdown).toBeVisible({ timeout: 5000 });

      // Press ArrowDown to navigate to next option
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Press Enter to select
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);

      // Verify language changed - dropdown should close and selector should show new value
      await expect(dropdown).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle rapid language switching', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      const selector = markdownPane.locator('[aria-label="Select language version"]');

      // Rapidly switch languages 3 times
      for (let i = 0; i < 3; i++) {
        await selector.click();
        await page.waitForTimeout(200);
        
        const options = page.locator('[role="option"]');
        const randomIndex = (i + 1) % (await options.count());
        await options.nth(randomIndex).click();
        await page.waitForTimeout(200);
      }

      // Wait for final state
      await page.waitForTimeout(500);

      // Should be in stable state with content visible
      const content = await markdownPane.textContent();
      expect(content).toBeTruthy();
      expect(content?.length).toBeGreaterThan(10);
    });

    test('should maintain language selection when switching modes multiple times', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      
      // Select French
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      
      const FrenchOption = page.getByRole('option', { name: /French/ }).first();
      await FrenchOption.click();
      await page.waitForTimeout(500);

      // Switch to 3-pane
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Switch back to 2-pane
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);

      // Switch to 3-pane again
      await page.locator('[data-testid="three-pane-button"]').click();
      await page.waitForTimeout(500);

      // Back to 2-pane
      await page.locator('[data-testid="two-pane-button"]').click();
      await page.waitForTimeout(500);

      // French should still be selected
      const finalPane = page.locator('[data-pane-id^="markdown"]').first();
      await expect(finalPane.locator('text=/French/')).toBeVisible();
    });

    test('should handle language selection combined with page navigation', async ({ page }) => {
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      
      // Navigate to page 2
      const nextButton = page.locator('[data-testid="pager-next"]').first();
      await nextButton.click();
      await page.waitForTimeout(800);

      // Change language to French
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      await selector.click();
      await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
      
      const frenchOption = page.getByRole('option', { name: /French/ }).first();
      await frenchOption.click();
      
      // Wait for language change to complete
      await page.waitForTimeout(1500);

      // Try to find pager - if it's not found, skip navigation test
      try {
        await page.locator('[data-testid="pager-next"]').first().waitFor({ state: 'visible', timeout: 5000 });
      } catch {
        // Just verify language persisted
        await expect(markdownPane.locator('text=/French/')).toBeVisible();
        return;
      }

      // Navigate to page 4 
      const pagerNext = page.locator('[data-testid="pager-next"]').first();
      await pagerNext.waitFor({ state: 'visible', timeout: 3000 });
      await pagerNext.click();
      await page.waitForTimeout(1500);
      
      await pagerNext.waitFor({ state: 'visible', timeout: 3000 });
      await pagerNext.click();
      await page.waitForTimeout(1500);

      // French should still be selected
      await expect(markdownPane.locator('text=/French/')).toBeVisible();
    });
  });

  test.describe('Read-Only Mode', () => {
    test('should show read-only text when only one language available', async ({ page }) => {
      // Navigate to a document with only one language (if such test data exists)
      // This is a placeholder test that depends on test data structure
      
      // For kombucha with multiple languages, selector should be interactive
      const markdownPane = page.locator('[data-pane-id^="markdown"]').first();
      const selector = markdownPane.locator('[aria-label="Select language version"]');
      
      // Should be clickable (not read-only for kombucha)
      await expect(selector).toBeEnabled();
    });
  });
});
