import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  ApiKeyCreateSchema
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Generate API key
function generateApiKey(): string {
  return 'qsk_' + crypto.randomBytes(32).toString('base64url');
}

// Hash API key
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET /api/admin/api-keys - List API keys (without showing raw keys)
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
      { status: 429, headers: { ...corsHeaders, ...rateLimitResult.headers } }
    );
  }

  // Authentication - only owners and admins can manage API keys
  const authContext = await authenticateAdminRequest(request);
  if (!authContext) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication'),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const supabase = await createClient();

    // Get API keys for the tenant
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select(`
        id,
        name,
        key_hash,
        scopes,
        created_at,
        last_used_at
      `)
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch API keys'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format response (never show full key, only last 4 chars of hash)
    const formattedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key_preview: '***' + key.key_hash.slice(-4),
      scopes: key.scopes,
      created_at: key.created_at,
      last_used_at: key.last_used_at
    }));

    return NextResponse.json(
      createSuccessResponse(formattedKeys),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/admin/api-keys:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/api-keys - Create new API key
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
      { status: 429, headers: { ...corsHeaders, ...rateLimitResult.headers } }
    );
  }

  // Authentication - only owners and admins can create API keys
  const authContext = await authenticateAdminRequest(request);
  if (!authContext) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication'),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!hasScope(authContext, 'api_keys')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for API keys access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const { name, scopes } = ApiKeyCreateSchema.parse(body);

    // Generate new API key
    const rawKey = generateApiKey();
    const keyHash = hashApiKey(rawKey);

    const supabase = await createClient();

    // Create API key record
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        tenant_id: authContext.tenantId,
        name,
        key_hash: keyHash,
        scopes,
        created_by: authContext.userId!
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to create API key'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        id: apiKey.id,
        name,
        rawKeyOnce: rawKey, // Only returned once!
        scopes
      }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/api-keys:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid API key data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
