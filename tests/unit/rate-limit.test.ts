import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { withRateLimit, adminApiLimiter, adminBulkLimiter } from '../../apps/web/lib/rate-limit';

// Mock time for consistent testing
const mockDate = new Date('2024-01-01T00:00:00Z');

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    
    // Clear rate limiter state
    adminApiLimiter.cleanup();
    adminBulkLimiter.cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rate Limit Function', () => {
    it('should allow requests within limit', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });

      const result = withRateLimit(adminApiLimiter)(request);
      
      expect(result.allowed).toBe(true);
      expect(result.headers['X-RateLimit-Limit']).toBe('60');
      expect(result.headers['X-RateLimit-Remaining']).toBe('59');
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should block requests exceeding limit', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      });

      // Exhaust the rate limit (60 requests per minute)
      for (let i = 0; i < 60; i++) {
        const result = withRateLimit(adminApiLimiter)(request);
        expect(result.allowed).toBe(true);
      }

      // 61st request should be blocked
      const blockedResult = withRateLimit(adminApiLimiter)(request);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.headers['X-RateLimit-Remaining']).toBe('0');
    });

    it('should reset tokens after time window', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.3' }
      });

      // Use up some tokens
      for (let i = 0; i < 30; i++) {
        withRateLimit(adminApiLimiter)(request);
      }

      let result = withRateLimit(adminApiLimiter)(request);
      expect(result.headers['X-RateLimit-Remaining']).toBe('29');

      // Advance time by 1 minute (refill period)
      vi.advanceTimersByTime(60 * 1000);

      // Should have full tokens again
      result = withRateLimit(adminApiLimiter)(request);
      expect(result.headers['X-RateLimit-Remaining']).toBe('59');
    });

    it('should handle different IPs separately', () => {
      const request1 = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.4' }
      });
      
      const request2 = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.5' }
      });

      // Use up tokens for first IP
      for (let i = 0; i < 60; i++) {
        withRateLimit(adminApiLimiter)(request1);
      }

      // First IP should be blocked
      const result1 = withRateLimit(adminApiLimiter)(request1);
      expect(result1.allowed).toBe(false);

      // Second IP should still be allowed
      const result2 = withRateLimit(adminApiLimiter)(request2);
      expect(result2.allowed).toBe(true);
      expect(result2.headers['X-RateLimit-Remaining']).toBe('59');
    });

    it('should extract IP from various headers', () => {
      // Test x-forwarded-for
      const request1 = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' }
      });
      
      let result = withRateLimit(adminApiLimiter)(request1);
      expect(result.allowed).toBe(true);

      // Test x-real-ip
      const request2 = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-real-ip': '203.0.113.2' }
      });
      
      result = withRateLimit(adminApiLimiter)(request2);
      expect(result.allowed).toBe(true);

      // Test cf-connecting-ip (Cloudflare)
      const request3 = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'cf-connecting-ip': '203.0.113.3' }
      });
      
      result = withRateLimit(adminApiLimiter)(request3);
      expect(result.allowed).toBe(true);
    });

    it('should use fallback IP when headers missing', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs');
      
      const result = withRateLimit(adminApiLimiter)(request);
      expect(result.allowed).toBe(true);
      // Should use default fallback IP
    });
  });

  describe('Different Rate Limiters', () => {
    it('should have different limits for regular vs bulk operations', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.6' }
      });

      // Regular limiter: 60 requests/minute
      for (let i = 0; i < 60; i++) {
        const result = withRateLimit(adminApiLimiter)(request);
        expect(result.allowed).toBe(true);
      }
      
      const regularResult = withRateLimit(adminApiLimiter)(request);
      expect(regularResult.allowed).toBe(false);

      // Bulk limiter: 10 requests/minute (more restrictive)
      const bulkRequest = new NextRequest('http://localhost/api/admin/bulk', {
        headers: { 'x-forwarded-for': '192.168.1.7' }
      });

      for (let i = 0; i < 10; i++) {
        const result = withRateLimit(adminBulkLimiter)(bulkRequest);
        expect(result.allowed).toBe(true);
      }
      
      const bulkResult = withRateLimit(adminBulkLimiter)(bulkRequest);
      expect(bulkResult.allowed).toBe(false);
      expect(bulkResult.headers['X-RateLimit-Limit']).toBe('10');
    });

    it('should track regular and bulk limits independently', () => {
      const ip = '192.168.1.8';
      const regularRequest = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': ip }
      });
      const bulkRequest = new NextRequest('http://localhost/api/admin/bulk', {
        headers: { 'x-forwarded-for': ip }
      });

      // Use up bulk limit
      for (let i = 0; i < 10; i++) {
        withRateLimit(adminBulkLimiter)(bulkRequest);
      }

      // Bulk should be blocked
      const bulkResult = withRateLimit(adminBulkLimiter)(bulkRequest);
      expect(bulkResult.allowed).toBe(false);

      // Regular should still work (separate bucket)
      const regularResult = withRateLimit(adminApiLimiter)(regularRequest);
      expect(regularResult.allowed).toBe(true);
      expect(regularResult.headers['X-RateLimit-Remaining']).toBe('59');
    });
  });

  describe('Token Bucket Refill', () => {
    it('should gradually refill tokens over time', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.9' }
      });

      // Use up all tokens
      for (let i = 0; i < 60; i++) {
        withRateLimit(adminApiLimiter)(request);
      }

      // Should be blocked
      let result = withRateLimit(adminApiLimiter)(request);
      expect(result.allowed).toBe(false);
      expect(result.headers['X-RateLimit-Remaining']).toBe('0');

      // Advance time by 30 seconds (half refill period)
      vi.advanceTimersByTime(30 * 1000);

      // Should have some tokens back (partial refill)
      result = withRateLimit(adminApiLimiter)(request);
      expect(result.allowed).toBe(true);
      const remaining = parseInt(result.headers['X-RateLimit-Remaining']);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThan(60);
    });

    it('should not exceed maximum tokens', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.10' }
      });

      // Start fresh, advance time way beyond refill period
      vi.advanceTimersByTime(10 * 60 * 1000); // 10 minutes

      const result = withRateLimit(adminApiLimiter)(request);
      expect(result.allowed).toBe(true);
      // Should not exceed max capacity (60 tokens)
      expect(result.headers['X-RateLimit-Remaining']).toBe('59');
    });
  });

  describe('Cleanup', () => {
    it('should clean up old entries', () => {
      const request = new NextRequest('http://localhost/api/admin/jobs', {
        headers: { 'x-forwarded-for': '192.168.1.11' }
      });

      // Make a request to create an entry
      withRateLimit(adminApiLimiter)(request);

      // Advance time significantly
      vi.advanceTimersByTime(60 * 60 * 1000); // 1 hour

      // Cleanup should remove old entries
      adminApiLimiter.cleanup();

      // New request should start fresh
      const result = withRateLimit(adminApiLimiter)(request);
      expect(result.headers['X-RateLimit-Remaining']).toBe('59');
    });
  });
});
