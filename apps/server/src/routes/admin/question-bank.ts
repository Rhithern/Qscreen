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
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const QuestionSchema = z.object({
  prompt: z.string().min(1),
  reference_answer: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  tags: z.array(z.string()).optional()
});

router.options('*', (req, res) => {
  res.set(corsHeaders).status(200).end();
});

// GET /admin/question-bank - List questions
router.get('/', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'question-bank')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for question bank access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { data: questions, error } = await supabase
      .from('question_bank')
      .select('*')
      .eq('tenant_id', req.authContext!.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching questions:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch questions'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: questions
    });

  } catch (error) {
    logger.error('Error in GET /admin/question-bank:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// POST /admin/question-bank - Create question
router.post('/', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'question-bank')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for question bank access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const questionData = QuestionSchema.parse(req.body);

    const { data: question, error } = await supabase
      .from('question_bank')
      .insert({
        ...questionData,
        tenant_id: req.authContext!.tenantId,
        created_by: req.authContext!.userId
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating question:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to create question'
      });
    }

    res.status(201).set(corsHeaders).json({
      success: true,
      data: question
    });

  } catch (error) {
    logger.error('Error in POST /admin/question-bank:', error);
    if (error instanceof z.ZodError) {
      return res.status(422).set(corsHeaders).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid question data',
        field: 'body'
      });
    }
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// PATCH /admin/question-bank/:id - Update question
router.patch('/:id', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'question-bank')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for question bank access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = QuestionSchema.partial().parse(req.body);

    const { error } = await supabase
      .from('question_bank')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', req.authContext!.tenantId);

    if (error) {
      logger.error('Error updating question:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to update question'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { id }
    });

  } catch (error) {
    logger.error('Error in PATCH /admin/question-bank/:id:', error);
    if (error instanceof z.ZodError) {
      return res.status(422).set(corsHeaders).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid question data',
        field: 'body'
      });
    }
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// DELETE /admin/question-bank/:id - Delete question
router.delete('/:id', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'question-bank')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for question bank access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('question_bank')
      .delete()
      .eq('id', id)
      .eq('tenant_id', req.authContext!.tenantId);

    if (error) {
      logger.error('Error deleting question:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to delete question'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { id, deleted: true }
    });

  } catch (error) {
    logger.error('Error in DELETE /admin/question-bank/:id:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export default router;
