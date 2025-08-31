import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';

export interface AdminAuthContext {
  tenantId: string;
  userId?: string;
  scopes: string[];
  authMethod: 'api_key' | 'supabase_jwt';
}

export interface AdminApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// Hash function for API keys
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Validate API key format
function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith('qsk_') && key.length > 10;
}

// Parse cursor for pagination
export function parseCursor(cursor?: string): { createdAt: string; id: string } | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Create cursor for pagination
export function createCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt, id })).toString('base64url');
}

// Admin API authentication middleware
export async function authenticateAdminRequest(request: NextRequest): Promise<AdminAuthContext | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const supabase = await createClient();

  // Try API key authentication first
  if (isValidApiKeyFormat(token)) {
    const keyHash = hashApiKey(token);
    
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        tenant_id,
        scopes,
        created_by
      `)
      .eq('key_hash', keyHash)
      .single();

    if (error || !apiKey) {
      return null;
    }

    // Update last_used_at
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id);

    return {
      tenantId: apiKey.tenant_id,
      userId: apiKey.created_by,
      scopes: apiKey.scopes || [],
      authMethod: 'api_key'
    };
  }

  // Try Supabase JWT authentication
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return null;
    }

    // Get user's tenant membership and role
    const { data: membership, error: membershipError } = await supabase
      .from('tenant_members')
      .select(`
        tenant_id,
        role
      `)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return null;
    }

    // Map role to scopes
    const roleScopes: Record<string, string[]> = {
      owner: ['jobs', 'questions', 'invites', 'responses', 'team', 'api_keys'],
      admin: ['jobs', 'questions', 'invites', 'responses', 'team'],
      recruiter: ['jobs', 'questions', 'invites', 'responses'],
      reviewer: ['responses']
    };

    return {
      tenantId: membership.tenant_id,
      userId: user.id,
      scopes: roleScopes[membership.role] || [],
      authMethod: 'supabase_jwt'
    };
  } catch {
    return null;
  }
}

// Check if user has required scope
export function hasScope(context: AdminAuthContext, requiredScope: string): boolean {
  return context.scopes.includes(requiredScope);
}

// Create error response
export function createErrorResponse(code: string, message: string, field?: string): AdminApiResponse {
  return {
    ok: false,
    error: { code, message, field }
  };
}

// Create success response
export function createSuccessResponse<T>(data: T): AdminApiResponse<T> {
  return {
    ok: true,
    data
  };
}

// Validation schemas
export const PaginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional()
});

export const JobCreateSchema = z.object({
  title: z.string().min(1).max(200),
  location: z.string().max(100).optional(),
  jd: z.string().optional(),
  competencies: z.array(z.string()).default([]),
  due_date: z.string().datetime().optional(),
  status: z.enum(['draft', 'live', 'closed']).default('draft'),
  brand: z.object({
    logoUrl: z.string().url().optional(),
    colors: z.record(z.string()).optional()
  }).default({})
});

export const JobUpdateSchema = JobCreateSchema.partial();

export const QuestionBankCreateSchema = z.object({
  text: z.string().min(1).max(1000),
  tags: z.array(z.string()).default([]),
  time_limit_sec: z.number().min(30).max(600).default(120),
  ideal_answer: z.string().optional()
});

export const JobQuestionCreateSchema = z.object({
  text: z.string().min(1).max(1000),
  time_limit_sec: z.number().min(30).max(600).default(120),
  ideal_answer: z.string().optional(),
  position: z.number().min(0).optional()
});

export const InviteCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  notes: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  reminders: z.object({
    t72: z.boolean().optional(),
    t24: z.boolean().optional(),
    t4: z.boolean().optional()
  }).default({})
});

export const InviteBulkCreateSchema = z.object({
  csv: z.string() // base64 encoded CSV
});

export const TeamMemberCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'recruiter', 'reviewer'])
});

export const TeamMemberUpdateSchema = z.object({
  role: z.enum(['owner', 'admin', 'recruiter', 'reviewer'])
});

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['jobs', 'questions', 'invites', 'responses', 'team'])).default(['jobs', 'questions', 'invites', 'responses', 'team'])
});

export const ResponseScoreSchema = z.object({
  question_id: z.string().uuid(),
  score: z.number().min(0).max(10),
  notes: z.string().optional()
});

export const QuestionReorderSchema = z.object({
  positions: z.array(z.object({
    id: z.string().uuid(),
    position: z.number().min(0)
  }))
});
