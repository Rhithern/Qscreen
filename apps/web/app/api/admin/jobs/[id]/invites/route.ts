import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  authenticateAdminRequest, 
  hasScope, 
  createErrorResponse, 
  createSuccessResponse,
  PaginationSchema,
  InviteCreateSchema,
  InviteBulkCreateSchema,
  parseCursor,
  createCursor
} from '@/lib/admin-auth';
import { adminApiLimiter, adminBulkLimiter, withRateLimit } from '@/lib/rate-limit';

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/admin/jobs/[id]/invites - List job invites
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

  if (!hasScope(authContext, 'invites')) {
    return NextResponse.json(
      createErrorResponse('FORBIDDEN', 'Insufficient permissions for invites access'),
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

    // Build query
    let query = supabase
      .from('invites')
      .select(`
        id,
        email,
        name,
        notes,
        token,
        expires_at,
        used,
        reminders,
        created_at
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there are more

    // Apply status filter
    if (status === 'used') {
      query = query.eq('used', true);
    } else if (status === 'unused') {
      query = query.eq('used', false);
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString());
    }

    // Apply cursor pagination
    const cursorData = parseCursor(cursor);
    if (cursorData) {
      query = query.or(`created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`);
    }

    const { data: invites, error } = await query;

    if (error) {
      console.error('Error fetching invites:', error);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch invites'),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if there are more items
    const hasMore = invites.length > limit;
    const items = hasMore ? invites.slice(0, limit) : invites;
    
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
    console.error('Error in GET /api/admin/jobs/[id]/invites:', error);
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

// POST /api/admin/jobs/[id]/invites - Create job invites (single or bulk CSV)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const isBulk = 'csv' in body;
    
    // Use different rate limiter for bulk operations
    const rateLimitResult = withRateLimit(isBulk ? adminBulkLimiter : adminApiLimiter)(request);
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

    if (!hasScope(authContext, 'invites')) {
      return NextResponse.json(
        createErrorResponse('FORBIDDEN', 'Insufficient permissions for invites access'),
        { status: 403, headers: corsHeaders }
      );
    }

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

    if (isBulk) {
      // Handle bulk CSV upload
      const { csv } = InviteBulkCreateSchema.parse(body);
      
      // Decode base64 CSV
      const csvContent = Buffer.from(csv, 'base64').toString('utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'CSV file is empty'),
          { status: 422, headers: corsHeaders }
        );
      }

      // Parse CSV (expecting: email,name,notes)
      const results = [];
      const errors = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [email, name, notes] = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
        
        if (!email || !email.includes('@')) {
          errors.push({ row: i + 1, error: 'Invalid email address' });
          continue;
        }

        try {
          const inviteData = {
            job_id: jobId,
            email,
            name: name || null,
            notes: notes || null,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            reminders: {}
          };

          const { data: invite, error } = await supabase
            .from('invites')
            .insert(inviteData)
            .select('id, email, token')
            .single();

          if (error) {
            errors.push({ row: i + 1, error: error.message });
          } else {
            results.push(invite);
          }
        } catch (err) {
          errors.push({ row: i + 1, error: 'Failed to create invite' });
        }
      }

      return NextResponse.json(
        createSuccessResponse({
          created: results,
          errors,
          total: results.length,
          failed: errors.length
        }),
        { status: 201, headers: corsHeaders }
      );

    } else {
      // Handle single invite
      const inviteData = InviteCreateSchema.parse(body);
      
      const expiresAt = inviteData.expires_at 
        ? new Date(inviteData.expires_at).toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days default

      const { data: invite, error } = await supabase
        .from('invites')
        .insert({
          ...inviteData,
          job_id: jobId,
          expires_at: expiresAt
        })
        .select('id, token')
        .single();

      if (error) {
        console.error('Error creating invite:', error);
        return NextResponse.json(
          createErrorResponse('DATABASE_ERROR', 'Failed to create invite'),
          { status: 500, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        createSuccessResponse({ id: invite.id, token: invite.token }),
        { status: 201, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Error in POST /api/admin/jobs/[id]/invites:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Invalid invite data', 'body'),
        { status: 422, headers: corsHeaders }
      );
    }
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
