import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  TeamMemberCreateSchema
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/admin/team - List team members
export async function GET(request: NextRequest) {
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
    const supabase = await createClient();

    // Get team members for the tenant
    const { data: members, error } = await supabase
      .from('tenant_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles!inner(
          email,
          full_name
        )
      `)
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching team members:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch team members'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format response
    const formattedMembers = members.map(member => ({
      user_id: member.user_id,
      email: member.profiles.email,
      full_name: member.profiles.full_name,
      role: member.role,
      created_at: member.created_at
    }));

    return NextResponse.json(
      createSuccessResponse(formattedMembers),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/admin/team:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/team - Add team member
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { email, role } = TeamMemberCreateSchema.parse(body);

    const supabase = await createClient();

    // Check if user exists by email
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        createErrorResponse('USER_NOT_FOUND', 'User with this email does not exist'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        createErrorResponse('ALREADY_MEMBER', 'User is already a team member'),
        { status: 409, headers: corsHeaders }
      );
    }

    // Add user to team
    const { data: newMember, error } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: authContext.tenantId,
        user_id: existingUser.id,
        role
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding team member:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to add team member'),
        { status: 500, headers: corsHeaders }
      );
    }

    // TODO: Send invitation email to the user
    console.log(`Would send team invitation email to ${email} for role ${role}`);

    return NextResponse.json(
      createSuccessResponse({
        user_id: existingUser.id,
        email: existingUser.email,
        role
      }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/team:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid team member data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
