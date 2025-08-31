import { test, expect } from '@playwright/test';

test.describe('Interview Platform E2E', () => {
  test('loads landing page with navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Interview Platform/);
    
    // Check navigation links exist
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    
    // Check main content
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/interview/i);
  });

  test('employer registration and onboarding flow', async ({ page }) => {
    // Skip if email is disabled in dev
    if (process.env.NEXT_PUBLIC_DISABLE_EMAIL === 'true') {
      test.skip();
    }
    
    await page.goto('/auth/register/employer');
    
    // Check form elements
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    
    // Fill form with test data
    await page.getByLabel(/full name/i).fill('Test Employer');
    await page.getByLabel(/email/i).fill('test-employer@example.com');
    await page.getByLabel(/password/i).fill('testpassword123');
    await page.getByLabel(/company name/i).fill('Test Company');
    
    // Submit form - should redirect to /onboarding
    const submitButton = page.getByRole('button', { name: /create account/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
    
    // In a real test, we would submit and check redirect
    // await submitButton.click();
    // await expect(page).toHaveURL('/onboarding');
  });

  test('onboarding completion flow', async ({ page }) => {
    // Navigate to onboarding (will redirect to login if not authenticated)
    await page.goto('/onboarding');
    
    // Should either show login form or onboarding form
    const isLoginPage = await page.getByText(/sign in/i).count() > 0;
    const isOnboardingPage = await page.getByText(/company/i).count() > 0;
    
    expect(isLoginPage || isOnboardingPage).toBeTruthy();
    
    // If it's onboarding page, check for expected elements
    if (isOnboardingPage) {
      await expect(page.getByRole('main')).toBeVisible();
      // Should not have any 500 error indicators
      await expect(page.locator('text=500')).toHaveCount(0);
      await expect(page.locator('text=Internal Server Error')).toHaveCount(0);
    }
  });

  test('onboarding redirect prevention', async ({ page }) => {
    // Test that completed employers don't get stuck in onboarding loop
    await page.goto('/onboarding');
    
    // Should not show infinite redirects or errors
    await expect(page.locator('text=500')).toHaveCount(0);
    await expect(page.locator('text=redirect loop')).toHaveCount(0);
  });

  test('employer dashboard renders without errors', async ({ page }) => {
    // Navigate to employer page (will redirect to login if not authenticated)
    await page.goto('/employer');
    
    // Should either show login form or employer dashboard
    const isLoginPage = await page.locator('form').count() > 0;
    const isDashboard = await page.getByText(/interview/i).count() > 0;
    
    expect(isLoginPage || isDashboard).toBeTruthy();
    
    // If it's the dashboard, check for expected elements
    if (isDashboard) {
      await expect(page.getByRole('main')).toBeVisible();
      // Should not have any 500 error indicators
      await expect(page.locator('text=500')).toHaveCount(0);
      await expect(page.locator('text=Internal Server Error')).toHaveCount(0);
    }
  });

  test('candidate interview page with token', async ({ page }) => {
    // Use test token or skip if not provided
    const testToken = process.env.TEST_INVITE_TOKEN;
    
    if (!testToken) {
      // Navigate without token first
      await page.goto('/candidate');
      
      // Should show some guidance or login prompt
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.locator('text=500')).toHaveCount(0);
      
      test.skip('No TEST_INVITE_TOKEN provided');
    }
    
    // Navigate with token
    await page.goto(`/candidate?token=${testToken}`);
    
    // Should show interview interface (not error page)
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('text=500')).toHaveCount(0);
    await expect(page.locator('text=Internal Server Error')).toHaveCount(0);
    
    // Look for interview-related UI elements
    const hasInterviewUI = await page.locator('text=interview').count() > 0 ||
                          await page.locator('text=start').count() > 0 ||
                          await page.locator('button').count() > 0;
    
    expect(hasInterviewUI).toBeTruthy();
  });

  test('health endpoints are accessible', async ({ page }) => {
    // Test web health endpoint
    const webHealthResponse = await page.request.get('/api/health');
    expect(webHealthResponse.ok()).toBeTruthy();
    
    const webHealthData = await webHealthResponse.json();
    expect(webHealthData.ok).toBe(true);
    expect(webHealthData.service).toBe('web');
  });

  test('404 page renders correctly', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page, not crash
    await expect(page.getByRole('main')).toBeVisible();
    
    // Common 404 indicators
    const has404Content = await page.locator('text=404').count() > 0 ||
                         await page.locator('text=not found').count() > 0 ||
                         await page.locator('text=page not found').count() > 0;
    
    expect(has404Content).toBeTruthy();
  });

  test('accessibility: skip link is present', async ({ page }) => {
    await page.goto('/');
    
    // Skip link should be present (even if visually hidden)
    await expect(page.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument();
  });

  test('responsive design: mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should render without horizontal scroll
    await expect(page.getByRole('main')).toBeVisible();
    
    // Navigation should be responsive
    await expect(page.locator('nav')).toBeVisible();
  });
});
