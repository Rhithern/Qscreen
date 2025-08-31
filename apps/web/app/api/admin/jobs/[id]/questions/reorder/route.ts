import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  QuestionReorderSchema
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

// POST /api/admin/jobs/[id]/questions/reorder - Reorder job questions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { id: jobId } = params;
    const body = await request.json();
    const { positions } = QuestionReorderSchema.parse(body);

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

    // Verify all questions belong to this job
    const questionIds = positions.map(p => p.id);
    const { data: existingQuestions, error: questionsError } = await supabase
      .from('job_questions')
      .select('id')
      .eq('job_id', jobId)
      .in('id', questionIds);

    if (questionsError || existingQuestions.length !== questionIds.length) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'One or more questions not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Update positions in a transaction-like manner
    const updates = positions.map(({ id, position }) => 
      supabase
        .from('job_questions')
        .update({ position })
        .eq('id', id)
        .eq('job_id', jobId)
    );

    const results = await Promise.all(updates);
    const hasError = results.some(result => result.error);

    if (hasError) {
      console.error('Error reordering questions:', results.find(r => r.error)?.error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to reorder questions'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ updated: positions.length }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/jobs/[id]/questions/reorder:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid reorder data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
