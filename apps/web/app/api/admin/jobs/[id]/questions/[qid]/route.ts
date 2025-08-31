import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  JobQuestionCreateSchema
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

// PATCH /api/admin/jobs/[id]/questions/[qid] - Update job question
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
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

  if (!hasScope(authContext, 'questions')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for questions access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { id: jobId, qid: questionId } = params;
    const body = await request.json();
    const updateData = JobQuestionCreateSchema.partial().parse(body);

    const supabase = await createClient();

    // Verify job exists and belongs to tenant
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Job not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify question exists and belongs to job
    const { data: existingQuestion, error: questionError } = await supabase
      .from('job_questions')
      .select('id')
      .eq('id', questionId)
      .eq('job_id', jobId)
      .single();

    if (questionError || !existingQuestion) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Question not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Update question
    const { error: updateError } = await supabase
      .from('job_questions')
      .update(updateData)
      .eq('id', questionId)
      .eq('job_id', jobId);

    if (updateError) {
      console.error('Error updating job question:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to update question'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id: questionId }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in PATCH /api/admin/jobs/[id]/questions/[qid]:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid question data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE /api/admin/jobs/[id]/questions/[qid] - Delete job question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; qid: string } }
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

  if (!hasScope(authContext, 'questions')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for questions access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { id: jobId, qid: questionId } = params;
    const supabase = await createClient();

    // Verify job exists and belongs to tenant
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Job not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify question exists and belongs to job
    const { data: existingQuestion, error: questionError } = await supabase
      .from('job_questions')
      .select('id')
      .eq('id', questionId)
      .eq('job_id', jobId)
      .single();

    if (questionError || !existingQuestion) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Question not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete question
    const { error: deleteError } = await supabase
      .from('job_questions')
      .delete()
      .eq('id', questionId)
      .eq('job_id', jobId);

    if (deleteError) {
      console.error('Error deleting job question:', deleteError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to delete question'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id: questionId }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in DELETE /api/admin/jobs/[id]/questions/[qid]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
