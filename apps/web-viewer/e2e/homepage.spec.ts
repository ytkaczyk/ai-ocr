import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display homepage content correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('AI OCR Dashboard')
    
    // Check subtitle
    await expect(page.locator('h2')).toContainText('Modern document processing with Next.js and Supabase')
    
    // Check navigation buttons
    await expect(page.locator('text=Get Started')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should navigate to login page when clicking Get Started', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Get Started')
    await expect(page).toHaveURL('/login')
  })

  test('should navigate to dashboard when clicking Dashboard button', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Dashboard')
    // Should redirect to login since user is not authenticated
    await expect(page).toHaveURL('/login')
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
    await page.goto('/')
    
    // Check if main content is still visible
    await expect(page.locator('h1')).toContainText('AI OCR Dashboard')
    await expect(page.locator('text=Get Started')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})