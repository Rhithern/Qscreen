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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/admin/jobs/[id]/questions - List job questions
export async function GET(
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

    // Get job questions
    const { data: questions, error } = await supabase
      .from('job_questions')
      .select(`
        id,
        text,
        time_limit_sec,
        ideal_answer,
        position,
        created_at
      `)
      .eq('job_id', jobId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching job questions:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch questions'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse(questions),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/admin/jobs/[id]/questions:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/jobs/[id]/questions - Create job question
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
    const questionData = JobQuestionCreateSchema.parse(body);

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

    // If position not provided, get next position
    let position = questionData.position;
    if (position === undefined) {
      const { data: lastQuestion } = await supabase
        .from('job_questions')
        .select('position')
        .eq('job_id', jobId)
        .order('position', { ascending: false })
        .limit(1)
        .single();
      
      position = (lastQuestion?.position || -1) + 1;
    }

    // Create question
    const { data: question, error } = await supabase
      .from('job_questions')
      .insert({
        ...questionData,
        job_id: jobId,
        position
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating job question:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to create question'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id: question.id }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/jobs/[id]/questions:', error);
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
