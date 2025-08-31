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
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/admin/responses/[sessionId]/detail - Get detailed responses for a session
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
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

  if (!hasScope(authContext, 'responses')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for responses access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { sessionId } = params;
    const supabase = await createClient();

    // Verify session exists and belongs to tenant
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        job_id,
        candidate_id,
        status,
        jobs!inner(
          tenant_id,
          title
        ),
        profiles(
          email,
          full_name
        )
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Session not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify session belongs to user's tenant
    if (session.jobs.tenant_id !== authContext.tenantId) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', 'Access denied to this session'),
        { status: 403, headers: corsHeaders }
      );
    }

    // Get detailed responses with questions
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        id,
        question_id,
        audio_url,
        transcript,
        duration_sec,
        score,
        flags,
        created_at,
        job_questions!inner(
          id,
          text,
          time_limit_sec,
          position
        )
      `)
      .eq('session_id', sessionId)
      .order('job_questions(position)', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch response details'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Format response data
    const formattedResponses = responses.map(response => ({
      id: response.id,
      question_id: response.question_id,
      question_text: response.job_questions.text,
      question_time_limit: response.job_questions.time_limit_sec,
      question_position: response.job_questions.position,
      audio_url: response.audio_url,
      transcript: response.transcript,
      duration_sec: response.duration_sec,
      score: response.score,
      flags: response.flags || {},
      created_at: response.created_at
    }));

    return NextResponse.json(
      createSuccessResponse({
        session: {
          id: session.id,
          job_title: session.jobs.title,
          candidate_email: session.profiles?.email || 'Unknown',
          candidate_name: session.profiles?.full_name || null,
          status: session.status
        },
        responses: formattedResponses
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/admin/responses/[sessionId]/detail:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
