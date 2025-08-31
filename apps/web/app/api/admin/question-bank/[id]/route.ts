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
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// DELETE /api/admin/question-bank/[id] - Delete reusable question
export async function DELETE(
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
    const { id } = params;
    const supabase = await createClient();

    // Check if question exists and belongs to tenant
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('question_bank')
      .select('id, tenant_id')
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (fetchError || !existingQuestion) {
      return NextResponse.json(
        createErrorResponse('NOT_FOUND', 'Question not found'),
        { status: 404, headers: corsHeaders }
      );
    }

    // Delete question
    const { error: deleteError } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to delete question'),
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      createSuccessResponse({ id }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in DELETE /api/admin/question-bank/[id]:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error'),
      { status: 500, headers: corsHeaders }
    );
  }
}
