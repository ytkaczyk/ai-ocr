import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login page correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Check if login form elements are present
    await expect(page.locator('[data-testid="email"]')).toBeVisible()
    await expect(page.locator('[data-testid="password"]')).toBeVisible()
    await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible()
    
    // Check page title and headings
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('text=Welcome back to AI OCR Dashboard')).toBeVisible()
  })

  test('should display signup page correctly', async ({ page }) => {
    await page.goto('/signup')
    
    // Check if signup form elements are present
    await expect(page.locator('[data-testid="email"]')).toBeVisible()
    await expect(page.locator('[data-testid="password"]')).toBeVisible()
    await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible()
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Sign Up')
    await expect(page.locator('text=Create your AI OCR Dashboard account')).toBeVisible()
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login')
    
    // Click sign up link
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/signup')
    
    // Click sign in link
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/login')
  })

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should be redirected to login page
    await expect(page).toHaveURL('/login')
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.click('[data-testid="sign-in-button"]')
    
    // Should show browser validation errors (required fields)
    const emailInput = page.locator('[data-testid="email"]')
    const passwordInput = page.locator('[data-testid="password"]')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })
})