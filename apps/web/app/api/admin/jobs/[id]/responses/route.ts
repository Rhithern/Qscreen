import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  PaginationSchema,
  parseCursor,
  createCursor
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

// GET /api/admin/jobs/[id]/responses - List job responses with candidate summaries
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

  if (!hasScope(authContext, 'responses')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for responses access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { id: jobId } = params;
    const { searchParams } = new URL(request.url);
    const { limit, cursor } = PaginationSchema.parse({
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor')
    });

    const status = searchParams.get('status') || '';
    const minScore = searchParams.get('minScore') ? parseFloat(searchParams.get('minScore')!) : null;
    const flag = searchParams.get('flag') || '';

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

    // Get sessions with response summaries
    let query = supabase
      .from('sessions')
      .select(`
        id,
        candidate_id,
        status,
        started_at,
        submitted_at,
        created_at,
        profiles!inner(
          email,
          full_name
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply cursor pagination
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      query = query.or(`created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch responses'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get response statistics for each session
    const sessionIds = sessions.map(s => s.id);
    const { data: responseStats } = await supabase
      .from('responses')
      .select(`
        session_id,
        score,
        flags
      `)
      .in('session_id', sessionIds);

    // Calculate statistics per session
    const sessionSummaries = sessions.map(session => {
      const sessionResponses = responseStats?.filter(r => r.session_id === session.id) || [];
      const scores = sessionResponses.map(r => r.score).filter(s => s !== null);
      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      
      return {
        session_id: session.id,
        candidate_email: session.profiles?.email || 'Unknown',
        candidate_name: session.profiles?.full_name || null,
        status: session.status,
        answers_count: sessionResponses.length,
        avg_score: avgScore ? Math.round(avgScore * 10) / 10 : null,
        submitted_at: session.submitted_at,
        created_at: session.created_at
      };
    });

    // Apply filters
    let filteredSummaries = sessionSummaries;
    
    if (minScore !== null) {
      filteredSummaries = filteredSummaries.filter(s => s.avg_score !== null && s.avg_score >= minScore);
    }

    if (flag) {
      // This would require checking flags in responses - simplified for now
      // In a real implementation, you'd filter based on response flags
    }

    // Check if there are more items
    const hasMore = filteredSummaries.length > limit;
    const items = hasMore ? filteredSummaries.slice(0, limit) : filteredSummaries;
    
    // Create next cursor
    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = createCursor(lastItem.created_at, lastItem.session_id);
    }

    return NextResponse.json(
      createSuccessResponse({
        items,
        nextCursor,
        hasMore
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in GET /api/admin/jobs/[id]/responses:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid query parameters'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
