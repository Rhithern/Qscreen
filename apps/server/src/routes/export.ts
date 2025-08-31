import { Router, Request, Response } from 'express';
import { createClient } from '../utils/supabase';
import { authenticateAdminRequest, hasScope, createErrorResponse } from '../utils/admin-auth';

export const exportRoutes = Router();

// GET /api/export/interview/:id - Export interview data
exportRoutes.get('/interview/:id', async (req: Request, res: Response) => {
  try {
    const authContext = await authenticateAdminRequest(req);
    if (!authContext) {
      return res.status(401).json(
        createErrorResponse('UNAUTHORIZED', 'Invalid or missing authentication')
      );
    }

    if (!hasScope(authContext, 'export')) {
      return res.status(403).json(
        createErrorResponse('FORBIDDEN', 'Insufficient permissions for export access')
      );
    }

    const { id } = req.params;
    const supabase = await createClient();

    // Get interview data with responses
    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        *,
        responses(*),
        questions(*)
      `)
      .eq('id', id)
      .eq('tenant_id', authContext.tenantId)
      .single();

    if (error || !interview) {
      return res.status(404).json(
        createErrorResponse('NOT_FOUND', 'Interview not found')
      );
    }

    // Format export data
    const exportData = {
      interview: {
        id: interview.id,
        title: interview.title,
        created_at: interview.created_at,
        status: interview.status
      },
      questions: interview.questions,
      responses: interview.responses
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="interview-${id}.json"`);
    res.json(exportData);

  } catch (error) {
    console.error('Error in export interview:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Internal server error')
    );
  }
});
