import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { 
  authenticateAdminRequest, 
  requireScope, 
  errorResponse, 
  successResponse,
  hashApiKey,
  generateApiKey,
  isValidApiKeyFormat
} from '../../apps/web/lib/admin-auth';

// Mock Supabase
vi.mock('../../apps/web/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    auth: {
      getUser: vi.fn()
    }
  }))
}));

describe('Admin Auth Utils', () => {
  describe('API Key Functions', () => {
    it('should generate valid API key format', () => {
      const apiKey = generateApiKey();
      expect(apiKey).toMatch(/^qsk_[a-zA-Z0-9]{32}$/);
      expect(apiKey.length).toBe(36); // qsk_ + 32 chars
    });

    it('should validate API key format', () => {
      expect(isValidApiKeyFormat('qsk_abcd1234efgh5678ijkl9012mnop3456')).toBe(true);
      expect(isValidApiKeyFormat('qsk_short')).toBe(false);
      expect(isValidApiKeyFormat('invalid_format')).toBe(false);
      expect(isValidApiKeyFormat('bearer_token')).toBe(false);
    });

    it('should hash API keys consistently', () => {
      const apiKey = 'qsk_abcd1234efgh5678ijkl9012mnop3456';
      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Response Helpers', () => {
    it('should create error responses with correct structure', () => {
      const response = errorResponse('UNAUTHORIZED', 'Invalid token', 401);
      
      expect(response.status).toBe(401);
      
      // Parse the response body
      const body = JSON.parse(response.body as string);
      expect(body).toEqual({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token'
        }
      });
    });

    it('should create error responses with field validation', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Title is required', 422, 'title');
      
      expect(response.status).toBe(422);
      
      const body = JSON.parse(response.body as string);
      expect(body).toEqual({
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required',
          field: 'title'
        }
      });
    });

    it('should create success responses with data', () => {
      const testData = { id: '123', name: 'Test' };
      const response = successResponse(testData, 201);
      
      expect(response.status).toBe(201);
      
      const body = JSON.parse(response.body as string);
      expect(body).toEqual({
        ok: true,
        data: testData
      });
    });
  });

  describe('Scope Validation', () => {
    it('should allow access when user has required scope', () => {
      const userScopes = ['jobs', 'questions', 'invites'];
      const result = requireScope('jobs', userScopes);
      
      expect(result).toBe(true);
    });

    it('should deny access when user lacks required scope', () => {
      const userScopes = ['questions', 'invites'];
      const result = requireScope('jobs', userScopes);
      
      expect(result).toBe(false);
    });

    it('should allow admin scope to access everything', () => {
      const userScopes = ['admin'];
      
      expect(requireScope('jobs', userScopes)).toBe(true);
      expect(requireScope('questions', userScopes)).toBe(true);
      expect(requireScope('invites', userScopes)).toBe(true);
      expect(requireScope('responses', userScopes)).toBe(true);
      expect(requireScope('team', userScopes)).toBe(true);
    });
  });

  describe('Authentication', () => {
    let mockSupabase: any;

    beforeEach(() => {
      const { createClient } = require('../../apps/web/lib/supabase/server');
      mockSupabase = createClient();
      vi.clearAllMocks();
    });

    it('should return null for requests without authorization header', async () => {
      const request = new NextRequest('http://localhost/api/admin/jobs');
      
      const result = await authenticateAdminRequest(request);
      expect(result).toBe(null);
    });

    it('should return null for requests with invalid bearer format', async () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: 'Invalid format' }
      });
      
      const result = await authenticateAdminRequest(request);
      expect(result).toBe(null);
    });

    it('should authenticate valid API key', async () => {
      const apiKey = 'qsk_abcd1234efgh5678ijkl9012mnop3456';
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: `Bearer ${apiKey}` }
      });

      // Mock successful API key lookup
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                tenant_id: 'tenant-123',
                created_by: 'user-456',
                scopes: ['jobs', 'questions'],
                last_used_at: new Date().toISOString()
              }
            })
          })
        })
      });

      const result = await authenticateAdminRequest(request);
      
      expect(result).toEqual({
        tenantId: 'tenant-123',
        userId: 'user-456',
        scopes: ['jobs', 'questions'],
        authMethod: 'api_key'
      });
    });

    it('should return null for invalid API key', async () => {
      const apiKey = 'qsk_invalid1234efgh5678ijkl9012mnop3456';
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: `Bearer ${apiKey}` }
      });

      // Mock failed API key lookup
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await authenticateAdminRequest(request);
      expect(result).toBe(null);
    });

    it('should authenticate valid Supabase JWT', async () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Mock JWT
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: `Bearer ${jwtToken}` }
      });

      // Mock successful JWT verification
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-789' } },
        error: null
      });

      // Mock tenant membership lookup
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                tenant_id: 'tenant-456',
                role: 'admin'
              }
            })
          })
        })
      });

      const result = await authenticateAdminRequest(request);
      
      expect(result).toEqual({
        tenantId: 'tenant-456',
        userId: 'user-789',
        scopes: ['admin'], // admin role gets admin scope
        authMethod: 'supabase_jwt'
      });
    });

    it('should return null for invalid JWT', async () => {
      const jwtToken = 'invalid.jwt.token';
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: `Bearer ${jwtToken}` }
      });

      // Mock failed JWT verification
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' }
      });

      const result = await authenticateAdminRequest(request);
      expect(result).toBe(null);
    });

    it('should return null for user without tenant membership', async () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { authorization: `Bearer ${jwtToken}` }
      });

      // Mock successful JWT but no tenant membership
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-999' } },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      const result = await authenticateAdminRequest(request);
      expect(result).toBe(null);
    });
  });
});
