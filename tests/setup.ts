// Test setup file for Vitest
import { beforeAll } from 'vitest';

// Setup environment variables for tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  process.env.EMBED_JWT_SECRET = process.env.EMBED_JWT_SECRET || 'test-jwt-secret';
});
