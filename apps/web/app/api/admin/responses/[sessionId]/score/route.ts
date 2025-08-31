import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  ResponseScoreSchema
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

// POST /api/admin/responses/[sessionId]/score - Score a response
export async function POST(
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
    const body = await request.json();
    const { question_id, score, notes } = ResponseScoreSchema.parse(body);

    const supabase = await createClient();

    // Verify session exists and belongs to tenant
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        id,
        jobs!inner(
          tenant_id
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

    // Verify response exists for this session and question
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select('id')
      .eq('session_id', sessionId)
      .eq('question_id', question_id)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Response not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Update response score
    const { error: updateError } = await supabase
      .from('responses')
      .update({ score })
      .eq('id', response.id);

    if (updateError) {
      console.error('Error updating response score:', updateError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to update score'),
        { status: 500, headers: corsHeaders }
      );
    }

    // If notes provided, create or update evaluation record
    if (notes && authContext.userId) {
      const { error: evalError } = await supabase
        .from('evaluations')
        .upsert({
          response_id: response.id,
          reviewer_id: authContext.userId,
          score,
          notes
        }, {
          onConflict: 'response_id,reviewer_id'
        });

      if (evalError) {
        console.error('Error saving evaluation:', evalError);
        // Don't fail the request if evaluation save fails
      }
    }

    return NextResponse.json(
      createSuccessResponse({
        response_id: response.id,
        score,
        notes: notes || null
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/responses/[sessionId]/score:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid score data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
