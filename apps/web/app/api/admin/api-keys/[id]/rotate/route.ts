import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const runtime = 'nodejs';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// POST /api/admin/api-keys/[id]/rotate - Rotate API key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
      { status: 429, headers: { ...corsHeaders, ...rateLimitResult.headers } }
    );
  }

  // Authentication - only owners and admins can rotate API keys
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
    const { id } = await params;
    const supabase = await createClient();

    // Verify API key exists and belongs to tenant
    const { data: existingKey, error: keyError } = await supabase
      .from('api_keys')
      .select('id, name, scopes')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (keyError || !existingKey) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'API key not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Generate new API key
    const newRawKey = generateApiKey();
    const newKeyHash = hashApiKey(newRawKey);

    // Update API key with new hash
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({ 
        key_hash: newKeyHash,
        last_used_at: null // Reset last used time
      })
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (updateError) {
      console.error('Error rotating API key:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to rotate API key'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({
        id,
        name: existingKey.name,
        newRawKeyOnce: newRawKey, // Only returned once!
        scopes: existingKey.scopes
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/api-keys/[id]/rotate:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
