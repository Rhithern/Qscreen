import rateLimit from 'express-rate-limit';
import { Request } from 'express';

// Admin API rate limiter
export const adminApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs for admin API
  message: 'Too many admin API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Embed token rate limiter
export const embedTokenLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 embed token requests per windowMs
  message: 'Too many embed token requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function for manual rate limit checking
export function withRateLimit(limiter: any) {
  return (req: Request) => {
    // This is a simplified version - in practice you'd need to implement
    // the rate limiting logic manually or use middleware
    return {
      allowed: true,
      headers: {}
    };
  };
}
