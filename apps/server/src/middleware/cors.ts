import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Enhanced CORS validation with origin allowlist
export const validateOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;

  const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
  
  // Check for wildcard
  if (allowedOrigins.includes('*')) return true;
  
  // Check for exact match
  if (allowedOrigins.includes(origin)) return true;
  
  // Check for wildcard subdomain patterns (e.g., *.example.com)
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith(domain)) {
          return true;
        }
      } catch {
        // Invalid URL, skip
        continue;
      }
    }
  }
  
  return false;
};

// CORS middleware for embed endpoints
export const embedCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  // Allow requests without origin (e.g., server-to-server)
  if (!origin) {
    next();
    return;
  }
  
  if (validateOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  } else {
    res.status(403).json({ 
      error: 'Origin not allowed',
      origin: origin 
    });
  }
};

// WebSocket origin validation
export const validateWebSocketOrigin = (origin: string | undefined): boolean => {
  return validateOrigin(origin);
};

// Admin API CORS validation
export const validateAdminOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  
  const allowedOrigins = config.ADMIN_API_ALLOWED_ORIGINS.split(',').map(o => o.trim());
  
  if (allowedOrigins.includes('*')) return true;
  if (allowedOrigins.includes(origin)) return true;
  
  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      try {
        const originUrl = new URL(origin);
        if (originUrl.hostname.endsWith(domain)) {
          return true;
        }
      } catch {
        continue;
      }
    }
  }
  
  return false;
};

// Admin CORS middleware
export const adminCorsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (!origin) {
    next();
    return;
  }
  
  if (validateAdminOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  } else {
    res.status(403).json({ 
      error: 'Admin origin not allowed',
      origin: origin 
    });
  }
};
