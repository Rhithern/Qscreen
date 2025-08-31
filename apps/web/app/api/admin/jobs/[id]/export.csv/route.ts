import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse
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

// GET /api/admin/jobs/[id]/export.csv - Export responses as CSV
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
    const supabase = await createClient();

    // Verify job exists and belongs to tenant
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', jobId)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Job not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get all responses for this job with related data
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        transcript,
        duration_sec,
        score,
        created_at,
        sessions!inner(
          candidate_id,
          submitted_at,
          profiles(
            email,
            full_name
          )
        ),
        job_questions!inner(
          text,
          position
        )
      `)
      .eq('sessions.job_id', jobId)
      .order('sessions.submitted_at', { ascending: true })
      .order('job_questions.position', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses for export:', responsesError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch responses'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate CSV content
    const csvHeaders = [
      'candidate_email',
      'candidate_name',
      'question',
      'duration_sec',
      'transcript',
      'score',
      'submitted_at'
    ];

    const csvRows = responses.map(response => [
      response.sessions.profiles?.email || 'Unknown',
      response.sessions.profiles?.full_name || '',
      `"${response.job_questions.text.replace(/"/g, '""')}"`, // Escape quotes
      response.duration_sec || '',
      `"${(response.transcript || '').replace(/"/g, '""')}"`, // Escape quotes
      response.score || '',
      response.sessions.submitted_at || ''
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Return CSV as streaming response
    const filename = `${job.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses_${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/jobs/[id]/export.csv:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
