import { Router } from 'express';
import { adminApiLimiter } from '../../utils/rate-limit';
import { authenticateAdmin, hasScope } from '../../utils/admin-auth';
import { supabase } from '../../utils/supabase';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const router = Router();

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const ScoreUpdateSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().optional()
});

router.options('*', (req, res) => {
  res.set(corsHeaders).status(200).end();
});

// GET /admin/responses - List all responses
router.get('/', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'responses')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for responses access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        *,
        sessions!inner(interview_id, candidate_id),
        interviews!inner(title, tenant_id)
      `)
      .eq('interviews.tenant_id', req.authContext!.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching responses:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch responses'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: responses
    });

  } catch (error) {
    logger.error('Error in GET /admin/responses:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// GET /admin/responses/:sessionId/detail - Get session details
router.get('/:sessionId/detail', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'responses')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for responses access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        interviews!inner(title, tenant_id),
        responses(*)
      `)
      .eq('id', sessionId)
      .eq('interviews.tenant_id', req.authContext!.tenantId)
      .single();

    if (sessionError || !session) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Session not found'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: session
    });

  } catch (error) {
    logger.error('Error in GET /admin/responses/:sessionId/detail:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// PATCH /admin/responses/:sessionId/score - Update response score
router.patch('/:sessionId/score', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'responses')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for responses access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score, feedback } = ScoreUpdateSchema.parse(req.body);

    // Verify session belongs to tenant
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('interviews!inner(tenant_id)')
      .eq('id', sessionId)
      .eq('interviews.tenant_id', req.authContext!.tenantId)
      .single();

    if (sessionError || !session) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Session not found'
      });
    }

    // Update session score
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ 
        running_score: score,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      logger.error('Error updating session score:', updateError);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to update session score'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { session_id: sessionId, score, feedback }
    });

  } catch (error) {
    logger.error('Error in PATCH /admin/responses/:sessionId/score:', error);
    if (error instanceof z.ZodError) {
      return res.status(422).set(corsHeaders).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid score data',
        field: 'body'
      });
    }
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export default router;
