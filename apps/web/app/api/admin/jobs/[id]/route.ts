import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  JobUpdateSchema
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// PATCH /api/admin/jobs/[id] - Update job
export async function PATCH(
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

  // Authentication
  const authContext = await authenticateAdminRequest(request);
  if (!authContext) {
    return NextResponse.json(
      createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication'),
      { status: 401, headers: corsHeaders }
    );
  }

  if (!hasScope(authContext, 'jobs')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for jobs access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = JobUpdateSchema.parse(body);

    const supabase = await createClient();

    // Check if job exists and belongs to tenant
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, tenant_id')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Job not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Update job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (updateError) {
      console.error('Error updating job:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to update job'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in PATCH /api/admin/jobs/[id]:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid job data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
