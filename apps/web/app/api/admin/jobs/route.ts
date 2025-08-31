import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  PaginationSchema,
  JobCreateSchema,
  parseCursor,
  createCursor
} from '@/lib/admin-auth';
import { adminApiLimiter, withRateLimit, getClientIdentifier } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/admin/jobs - List jobs with pagination
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

  if (!hasScope(authContext, 'jobs')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for jobs access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const { limit, cursor } = PaginationSchema.parse({
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor')
    });

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        location,
        due_date,
        competencies,
        created_at,
        updated_at
      `)
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there are more

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Apply cursor pagination
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      query = query.or(`created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`);
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch jobs'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if there are more items
    const hasMore = jobs.length > limit;
    const items = hasMore ? jobs.slice(0, limit) : jobs;
    
    // Create next cursor
    let nextCursor: string | undefined;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = createCursor(lastItem.created_at, lastItem.id);
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
    console.error('Error in GET /api/admin/jobs:', error);
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

// POST /api/admin/jobs - Create new job
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

  if (!hasScope(authContext, 'jobs')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for jobs access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const jobData = JobCreateSchema.parse(body);

    const supabase = await createClient();

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        tenant_id: authContext.tenantId,
        created_by: authContext.userId!,
        competencies: jobData.competencies,
        brand: jobData.brand
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to create job'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id: job.id }),
      { status: 201, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in POST /api/admin/jobs:', error);
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
