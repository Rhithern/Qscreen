import { test, expect } from '@playwright/test';

test.describe('Embed Widget', () => {
  test('should load and connect embed widget', async ({ page }) => {
    // Navigate to test page
    await page.goto('/embed/test');
    
    // Wait for widget to load
    await expect(page.locator('#test-widget')).toBeVisible();
    await expect(page.getByText('Start Interview')).toBeVisible();
    
    // Check that logs show SDK loaded
    await expect(page.locator('.bg-black').getByText('Embed SDK loaded successfully')).toBeVisible();
  });

  test('should handle join button click and request permissions', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone']);
    
    await page.goto('/embed/test');
    
    // Wait for widget and click join
    await expect(page.getByText('Start Interview')).toBeVisible();
    await page.getByText('Start Interview').click();
    
    // Should see listening state
    await expect(page.getByText('Listening')).toBeVisible({ timeout: 10000 });
    
    // Check progress indicators
    await expect(page.locator('#qscreen-progress')).toBeVisible();
    await expect(page.locator('#qscreen-timer')).toBeVisible();
  });

  test('should show captions when enabled', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    
    await page.goto('/embed/test');
    await page.getByText('Start Interview').click();
    
    // Wait for captions area to appear
    await expect(page.locator('#qscreen-captions')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Your response will appear here')).toBeVisible();
  });

  test('should handle submit flow', async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    
    await page.goto('/embed/test');
    await page.getByText('Start Interview').click();
    
    // Wait for submit button to appear
    await expect(page.getByText('Submit Interview')).toBeVisible({ timeout: 5000 });
    
    // Click submit
    await page.getByText('Submit Interview').click();
    
    // Should see submitted state
    await expect(page.getByText('Submitted')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test with invalid token by mocking the API
    await page.route('/api/embed/token', route => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid invite token' })
      });
    });

    await page.goto('/embed/test');
    
    // Should show error state
    await expect(page.locator('#qscreen-error')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Failed to initialize')).toBeVisible();
  });
});

test.describe('Embed API Endpoints', () => {
  test('should return config from /api/embed/config', async ({ request }) => {
    const response = await request.get('/api/embed/config');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('conductorUrl');
    expect(data).toHaveProperty('webOrigin');
    expect(data).toHaveProperty('features');
    expect(data.features).toHaveProperty('captions', true);
    expect(data.features).toHaveProperty('progress', true);
  });

  test('should validate invite token in /api/embed/token', async ({ request }) => {
    // Test with invalid token
    const response = await request.post('/api/embed/token', {
      data: { inviteToken: 'invalid-token' }
    });
    
    expect(response.status()).toBe(404);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should enforce rate limiting', async ({ request }) => {
    // Make multiple rapid requests to trigger rate limit
    const promises = Array.from({ length: 10 }, () => 
      request.post('/api/embed/token', {
        data: { inviteToken: 'test-token' }
      })
    );
    
    const responses = await Promise.all(promises);
    
    // At least one should be rate limited
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBeTruthy();
  });
});
