import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST /api/admin/invites/[inviteId]/regenerate - Regenerate invite token
export async function POST(
  request: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  // Rate limiting
  const rateLimitResult = withRateLimit(adminApiLimiter)(request);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      createErrorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
      { status: 429, headers: { ...corsHeaders, ...rateLimitResult.headers } }
    );
  }

  // Authentication
  const authContext = await authenticateAdminRequest(request);
  if (!authContext) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication'),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!hasScope(authContext, 'invites')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for invites access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { inviteId } = params;
    const supabase = await createClient();

    // Get invite details with job info to verify tenant
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        id,
        email,
        jobs!inner(
          tenant_id
        )
      `)
      .eq('id', inviteId)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Invite not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify invite belongs to user's tenant
    if (invite.jobs.tenant_id !== authContext.tenantId) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', 'Access denied to this invite'),
        { status: 403, headers: corsHeaders }
      );
    }

    // Generate new token and reset used status
    const { data: updatedInvite, error: updateError } = await supabase
      .from('invites')
      .update({
        token: supabase.rpc('gen_random_uuid'),
        used: false
      })
      .eq('id', inviteId)
      .select('token')
      .single();

    if (updateError || !updatedInvite) {
      console.error('Error regenerating invite token:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to regenerate invite token'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate new magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const newMagicLink = `${baseUrl}/interview/${updatedInvite.token}`;

    return NextResponse.json(
      createSuccessResponse({
        regenerated: true,
        newToken: updatedInvite.token,
        newMagicLink
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/invites/[inviteId]/regenerate:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
