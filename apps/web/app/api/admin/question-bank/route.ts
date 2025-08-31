import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  PaginationSchema,
  QuestionBankCreateSchema,
  parseCursor,
  createCursor
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

// GET /api/admin/question-bank - List reusable questions
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

  if (!hasScope(authContext, 'questions')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for questions access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const { limit, cursor } = PaginationSchema.parse({
      limit: searchParams.get('limit'),
      cursor: searchParams.get('cursor')
    });

    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('question_bank')
      .select(`
        id,
        text,
        tags,
        time_limit_sec,
        ideal_answer,
        created_at
      `)
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there are more

    // Apply tag filter
    if (tags.length > 0) {
      query = query.overlaps('tags', tags);
    }

    // Apply cursor pagination
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      query = query.or(`created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching question bank:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch questions'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if there are more items
    const hasMore = questions.length > limit;
    const items = hasMore ? questions.slice(0, limit) : questions;
    
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
    console.error('Error in GET /api/admin/question-bank:', error);
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

// POST /api/admin/question-bank - Create reusable question
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

  if (!hasScope(authContext, 'questions')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for questions access'),
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const questionData = QuestionBankCreateSchema.parse(body);

    const supabase = await createClient();

    const { data: question, error } = await supabase
      .from('question_bank')
      .insert({
        ...questionData,
        tenant_id: authContext.tenantId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating question:', error);
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
    console.error('Error in POST /api/admin/question-bank:', error);
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
