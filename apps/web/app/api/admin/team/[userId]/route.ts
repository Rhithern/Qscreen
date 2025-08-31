import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  TeamMemberUpdateSchema
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/team/[userId] - Update team member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

  if (!hasScope(authContext, 'team')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for team access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const { role } = TeamMemberUpdateSchema.parse(body);

    const supabase = await createClient();

    // Verify member exists and belongs to tenant
    const { data: existingMember, error: memberError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', userId)
      .single();

    if (memberError || !existingMember) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Team member not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent self-demotion from owner role
    if (authContext.userId === userId && existingMember.role === 'owner' && role !== 'owner') {
      return NextResponse.json(
        createErrorResponse('CANNOT_DEMOTE_SELF', 'Cannot demote yourself from owner role'),
        { status: 409, headers: corsHeaders }
      );
    }

    // Update member role
    const { error: updateError } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating team member role:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to update team member'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ user_id: userId, role }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in PATCH /api/admin/team/[userId]:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid role data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/admin/team/[userId] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

  if (!hasScope(authContext, 'team')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for team access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Verify member exists and belongs to tenant
    const { data: existingMember, error: memberError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', userId)
      .single();

    if (memberError || !existingMember) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Team member not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Prevent self-removal
    if (authContext.userId === userId) {
      return NextResponse.json(
        createErrorResponse('CANNOT_REMOVE_SELF', 'Cannot remove yourself from the team'),
        { status: 409, headers: corsHeaders }
      );
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error removing team member:', deleteError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to remove team member'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ user_id: userId, removed: true }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in DELETE /api/admin/team/[userId]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
