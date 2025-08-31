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

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// DELETE /api/admin/api-keys/[id] - Delete API key
export async function DELETE(
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

  // Authentication - only owners and admins can delete API keys
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
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (keyError || !existingKey) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'API key not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete API key
    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (deleteError) {
      console.error('Error deleting API key:', deleteError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to delete API key'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id, deleted: true }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys/[id]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
