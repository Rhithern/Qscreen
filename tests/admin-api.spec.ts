import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data
const TEST_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_EMAIL = 'admin@test.com';
const TEST_USER_PASSWORD = 'testpassword123';

let testApiKey: string;
let testJobId: string;
let testInviteId: string;
let testSessionId: string;

test.describe('Admin API Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let userToken: string;

  test.beforeAll(async () => {
    // Initialize Supabase client with service role key for setup
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Create test user and tenant setup
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true
    });

    if (authError) {
      console.error('Failed to create test user:', authError);
      throw authError;
    }

    // Add user to tenant as owner
    await supabase
      .from('tenant_members')
      .upsert({
        tenant_id: TEST_TENANT_ID,
        user_id: authData.user.id,
        role: 'owner'
      });

    // Get user JWT token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });

    if (signInError) throw signInError;
    userToken = signInData.session!.access_token;
  });

  test.afterAll(async () => {
    // Cleanup test data
    if (testJobId) {
      await supabase.from('jobs').delete().eq('id', testJobId);
    }
    
    // Delete test user
    const { data: userData } = await supabase.auth.getUser(userToken);
    if (userData.user) {
      await supabase.auth.admin.deleteUser(userData.user.id);
    }
  });

  test('should create and manage API keys', async ({ request }) => {
    // Create API key
    const createResponse = await request.post(`${BASE_URL}/api/admin/api-keys`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test Integration Key',
        scopes: ['jobs', 'questions', 'invites']
      }
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.ok).toBe(true);
    expect(createData.data.rawKeyOnce).toMatch(/^qsk_/);
    
    testApiKey = createData.data.rawKeyOnce;
    const keyId = createData.data.id;

    // List API keys
    const listResponse = await request.get(`${BASE_URL}/api/admin/api-keys`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);

    // Rotate API key
    const rotateResponse = await request.post(`${BASE_URL}/api/admin/api-keys/${keyId}/rotate`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    expect(rotateResponse.status()).toBe(200);
    const rotateData = await rotateResponse.json();
    expect(rotateData.ok).toBe(true);
    expect(rotateData.data.newRawKeyOnce).toMatch(/^qsk_/);
    
    testApiKey = rotateData.data.newRawKeyOnce; // Use new key for subsequent tests
  });

  test('should create and manage jobs', async ({ request }) => {
    // Create job using API key
    const createResponse = await request.post(`${BASE_URL}/api/admin/jobs`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Test Frontend Developer',
        location: 'Remote',
        jd: 'Test job description',
        competencies: ['JavaScript', 'React'],
        status: 'draft'
      }
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.ok).toBe(true);
    testJobId = createData.data.id;

    // List jobs
    const listResponse = await request.get(`${BASE_URL}/api/admin/jobs?limit=10`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.items.length).toBeGreaterThan(0);

    // Update job
    const updateResponse = await request.patch(`${BASE_URL}/api/admin/jobs/${testJobId}`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: 'Updated Frontend Developer',
        location: 'San Francisco'
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.ok).toBe(true);

    // Publish job
    const publishResponse = await request.post(`${BASE_URL}/api/admin/jobs/${testJobId}/publish`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(publishResponse.status()).toBe(200);
    const publishData = await publishResponse.json();
    expect(publishData.ok).toBe(true);
    expect(publishData.data.status).toBe('live');
  });

  test('should manage job questions', async ({ request }) => {
    // Create job question
    const createResponse = await request.post(`${BASE_URL}/api/admin/jobs/${testJobId}/questions`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        text: 'Tell me about your React experience',
        time_limit_sec: 120,
        ideal_answer: 'Should mention hooks, components, state management',
        position: 0
      }
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.ok).toBe(true);
    const questionId = createData.data.id;

    // List job questions
    const listResponse = await request.get(`${BASE_URL}/api/admin/jobs/${testJobId}/questions`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.length).toBe(1);

    // Update job question
    const updateResponse = await request.patch(`${BASE_URL}/api/admin/jobs/${testJobId}/questions/${questionId}`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        text: 'Tell me about your React and TypeScript experience',
        time_limit_sec: 180
      }
    });

    expect(updateResponse.status()).toBe(200);
    const updateData = await updateResponse.json();
    expect(updateData.ok).toBe(true);
  });

  test('should create and manage invites', async ({ request }) => {
    // Create single invite
    const createResponse = await request.post(`${BASE_URL}/api/admin/jobs/${testJobId}/invites`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        email: 'candidate@test.com',
        name: 'Test Candidate',
        notes: 'Test invite',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.ok).toBe(true);
    testInviteId = createData.data.id;

    // List invites
    const listResponse = await request.get(`${BASE_URL}/api/admin/jobs/${testJobId}/invites`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.items.length).toBe(1);

    // Send invite (get magic link)
    const sendResponse = await request.post(`${BASE_URL}/api/admin/invites/${testInviteId}/send`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(sendResponse.status()).toBe(200);
    const sendData = await sendResponse.json();
    expect(sendData.ok).toBe(true);
    expect(sendData.data.magicLink).toContain('/interview/');

    // Regenerate invite token
    const regenResponse = await request.post(`${BASE_URL}/api/admin/invites/${testInviteId}/regenerate`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(regenResponse.status()).toBe(200);
    const regenData = await regenResponse.json();
    expect(regenData.ok).toBe(true);
    expect(regenData.data.newMagicLink).toContain('/interview/');
  });

  test('should manage question bank', async ({ request }) => {
    // Create reusable question
    const createResponse = await request.post(`${BASE_URL}/api/admin/question-bank`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        text: 'Explain the difference between let and const',
        tags: ['javascript', 'fundamentals'],
        time_limit_sec: 90,
        ideal_answer: 'const creates immutable bindings...'
      }
    });

    expect(createResponse.status()).toBe(201);
    const createData = await createResponse.json();
    expect(createData.ok).toBe(true);
    const questionId = createData.data.id;

    // List question bank
    const listResponse = await request.get(`${BASE_URL}/api/admin/question-bank?tags=javascript`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.items.length).toBeGreaterThan(0);

    // Delete question
    const deleteResponse = await request.delete(`${BASE_URL}/api/admin/question-bank/${questionId}`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();
    expect(deleteData.ok).toBe(true);
  });

  test('should handle team management', async ({ request }) => {
    // List team members
    const listResponse = await request.get(`${BASE_URL}/api/admin/team`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(listResponse.status()).toBe(200);
    const listData = await listResponse.json();
    expect(listData.ok).toBe(true);
    expect(listData.data.length).toBeGreaterThan(0);

    // Note: We skip adding/removing team members in tests to avoid complexity
    // of creating additional test users. In a real test suite, you would:
    // 1. Create another test user
    // 2. Add them to the team
    // 3. Update their role
    // 4. Remove them from the team
  });

  test('should handle authentication errors', async ({ request }) => {
    // Test with invalid API key
    const invalidResponse = await request.get(`${BASE_URL}/api/admin/jobs`, {
      headers: {
        'Authorization': 'Bearer invalid_key'
      }
    });

    expect(invalidResponse.status()).toBe(401);
    const invalidData = await invalidResponse.json();
    expect(invalidData.ok).toBe(false);
    expect(invalidData.error.code).toBe('UNAUTHORIZED');

    // Test without authorization header
    const noAuthResponse = await request.get(`${BASE_URL}/api/admin/jobs`);
    expect(noAuthResponse.status()).toBe(401);
  });

  test('should handle rate limiting', async ({ request }) => {
    // This test would need to make many requests quickly to trigger rate limiting
    // For brevity, we'll just verify the rate limit headers are present
    const response = await request.get(`${BASE_URL}/api/admin/jobs`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
  });

  test('should validate request data', async ({ request }) => {
    // Test invalid job creation
    const invalidJobResponse = await request.post(`${BASE_URL}/api/admin/jobs`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        title: '', // Invalid: empty title
        status: 'invalid_status' // Invalid status
      }
    });

    expect(invalidJobResponse.status()).toBe(422);
    const invalidData = await invalidJobResponse.json();
    expect(invalidData.ok).toBe(false);
    expect(invalidData.error.code).toBe('VALIDATION_ERROR');
  });

  test('should export responses as CSV', async ({ request }) => {
    // This test assumes we have some response data
    // In a real scenario, you'd create a session and responses first
    const exportResponse = await request.get(`${BASE_URL}/api/admin/jobs/${testJobId}/export.csv`, {
      headers: {
        'Authorization': `Bearer ${testApiKey}`
      }
    });

    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()['content-type']).toContain('text/csv');
    expect(exportResponse.headers()['content-disposition']).toContain('attachment');
  });
});
