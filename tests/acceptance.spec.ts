import { test, expect } from '@playwright/test'

test.describe('Qscreen Acceptance Tests', () => {
  const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto(baseURL)
  })

  test('Employer Registration Flow', async ({ page }) => {
    // Navigate to employer registration
    await page.click('text=Sign up as Employer')
    await expect(page).toHaveURL(/\/auth\/register\/employer/)

    // Fill registration form
    await page.fill('input[name="email"]', 'test-employer@example.com')
    await page.fill('input[name="password"]', 'testpassword123')
    await page.fill('input[name="fullName"]', 'Test Employer')
    await page.fill('input[name="companyName"]', 'Test Company')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/)
  })

  test('Employer Login Flow', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In')
    await expect(page).toHaveURL(/\/auth\/login/)

    // Fill login form with demo credentials
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('Job Creation Flow', async ({ page }) => {
    // Login as employer first
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    
    // Navigate to job creation
    await page.goto(`${baseURL}/jobs/create`)
    await expect(page).toHaveURL(/\/jobs\/create/)

    // Fill job form
    await page.fill('input[name="title"]', 'Test Developer Position')
    await page.fill('input[name="location"]', 'Remote')
    await page.fill('textarea[name="description"]', 'Test job description for automated testing')
    await page.fill('input[name="competencies"]', 'JavaScript, React, Testing')
    
    // Set due date (7 days from now)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const dateString = futureDate.toISOString().split('T')[0]
    await page.fill('input[name="dueDate"]', dateString)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to jobs list
    await expect(page).toHaveURL(/\/jobs/)
    await expect(page.locator('text=Test Developer Position')).toBeVisible()
  })

  test('Candidate Invite Flow', async ({ page }) => {
    // Login as employer
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    
    // Navigate to invite composition
    await page.goto(`${baseURL}/invites/compose`)
    await expect(page).toHaveURL(/\/invites\/compose/)

    // Fill invite form
    await page.fill('input[name="candidateEmail"]', 'test-candidate@example.com')
    await page.fill('input[name="candidateName"]', 'Test Candidate')
    
    // Select job (assuming demo job exists)
    await page.selectOption('select[name="jobId"]', { index: 1 })
    
    // Set expiry date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const dateString = futureDate.toISOString().split('T')[0]
    await page.fill('input[name="expiryDate"]', dateString)
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to invites list
    await expect(page).toHaveURL(/\/invites/)
    await expect(page.locator('text=test-candidate@example.com')).toBeVisible()
  })

  test('Candidate Interview Access', async ({ page }) => {
    // Use demo invite token
    const demoToken = 'demo-invite-token-123'
    
    // Navigate to invite acceptance page
    await page.goto(`${baseURL}/invite/${demoToken}`)
    
    // Should show invite details
    await expect(page.locator('text=Frontend Developer Interview')).toBeVisible()
    await expect(page.locator('text=Demo Company')).toBeVisible()
    
    // Click continue button
    await page.click('text=Continue to Interview')
    
    // Should redirect to candidate dashboard or interview
    await expect(page).toHaveURL(/\/(candidate\/dashboard|interview)/)
  })

  test('Admin System Status', async ({ page }) => {
    // Login as admin/owner
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    
    // Navigate to system status
    await page.goto(`${baseURL}/admin/status`)
    await expect(page).toHaveURL(/\/admin\/status/)
    
    // Check status indicators
    await expect(page.locator('text=System Status')).toBeVisible()
    await expect(page.locator('text=Database')).toBeVisible()
    await expect(page.locator('text=Conductor')).toBeVisible()
  })

  test('API Health Checks', async ({ request }) => {
    // Test selfcheck endpoint
    const selfcheckResponse = await request.get(`${baseURL}/api/selfcheck`)
    expect(selfcheckResponse.ok()).toBeTruthy()
    
    const selfcheckData = await selfcheckResponse.json()
    expect(selfcheckData).toHaveProperty('status')
    expect(selfcheckData).toHaveProperty('timestamp')
    
    // Test dbcheck endpoint
    const dbcheckResponse = await request.get(`${baseURL}/api/dbcheck`)
    expect(dbcheckResponse.ok()).toBeTruthy()
    
    const dbcheckData = await dbcheckResponse.json()
    expect(dbcheckData).toHaveProperty('database')
    expect(dbcheckData).toHaveProperty('auth')
  })

  test('Navigation and UI Elements', async ({ page }) => {
    // Login as employer
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    
    // Test sidebar navigation
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Jobs')).toBeVisible()
    await expect(page.locator('text=Invites')).toBeVisible()
    
    // Test header elements
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    
    // Navigate through main sections
    await page.click('text=Jobs')
    await expect(page).toHaveURL(/\/jobs/)
    
    await page.click('text=Invites')
    await expect(page).toHaveURL(/\/invites/)
    
    await page.click('text=Dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('Error Handling', async ({ page }) => {
    // Test invalid login
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid')).toBeVisible()
    
    // Test protected route access
    await page.goto(`${baseURL}/dashboard`)
    await expect(page).toHaveURL(/\/auth\/login/)
    
    // Test invalid invite token
    await page.goto(`${baseURL}/invite/invalid-token`)
    await expect(page.locator('text=Invalid')).toBeVisible()
  })

  test('Responsive Design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto(`${baseURL}/auth/login`)
    await page.fill('input[name="email"]', 'employer@demo.com')
    await page.fill('input[name="password"]', 'demo123456')
    await page.click('button[type="submit"]')
    
    // Check mobile navigation
    await expect(page.locator('nav')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.reload()
    
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })
})
