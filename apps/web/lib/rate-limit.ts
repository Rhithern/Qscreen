import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = identifier;

    // Clean up expired entries
    if (this.store[key] && now > this.store[key].resetTime) {
      delete this.store[key];
    }

    // Initialize or get current state
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs
      };
    }

    const entry = this.store[key];
    entry.count++;

    return {
      allowed: entry.count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Global rate limiters for different endpoints
export const embedTokenLimiter = new RateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const embedConfigLimiter = new RateLimiter(60 * 1000, 30); // 30 requests per minute

// Admin API rate limiters (dev-friendly)
export const adminApiLimiter = new RateLimiter(60 * 1000, 60); // 60 requests per minute
export const adminBulkLimiter = new RateLimiter(60 * 1000, 10); // 10 bulk operations per minute

// Helper to get client identifier
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  let ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // For development, use a more specific identifier
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown') {
    ip = `dev-${request.headers.get('user-agent')?.slice(0, 50) || 'unknown'}`;
  }
  
  return ip;
}

// Middleware function for rate limiting
export function withRateLimit(limiter: RateLimiter) {
  return (request: NextRequest) => {
    const identifier = getClientIdentifier(request);
    const result = limiter.check(identifier);
    
    return {
      ...result,
      headers: {
        'X-RateLimit-Limit': limiter['maxRequests'].toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
      }
    };
  };
}

// Cleanup interval (run every 5 minutes)
setInterval(() => {
  embedTokenLimiter.cleanup();
  embedConfigLimiter.cleanup();
  adminApiLimiter.cleanup();
  adminBulkLimiter.cleanup();
}, 5 * 60 * 1000);
