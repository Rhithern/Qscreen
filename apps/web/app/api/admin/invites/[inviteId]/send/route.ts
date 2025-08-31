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

// POST /api/admin/invites/[inviteId]/send - Send invite email and return magic link
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

    // Get invite details with job and tenant info
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        id,
        email,
        name,
        token,
        expires_at,
        used,
        jobs!inner(
          id,
          title,
          tenant_id,
          tenants!inner(
            id,
            name
          )
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

    // Check if invite is still valid
    if (invite.used) {
      return NextResponse.json(
        createErrorResponse('INVITE_USED', 'Invite has already been used'),
        { status: 409, headers: corsHeaders }
      );
    }

    if (new Date(invite.expires_at) <= new Date()) {
      return NextResponse.json(
        createErrorResponse('INVITE_EXPIRED', 'Invite has expired'),
        { status: 409, headers: corsHeaders }
      );
    }

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/interview/${invite.token}`;

    // TODO: Send email using Resend/SMTP
    // For now, we'll just return the magic link
    // In a real implementation, you would:
    // 1. Use Resend or nodemailer to send the email
    // 2. Include the magic link in the email template
    // 3. Handle email sending errors appropriately

    console.log(`Would send email to ${invite.email} with magic link: ${magicLink}`);

    return NextResponse.json(
      createSuccessResponse({
        sent: true,
        email: invite.email,
        magicLink,
        expiresAt: invite.expires_at
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/invites/[inviteId]/send:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
