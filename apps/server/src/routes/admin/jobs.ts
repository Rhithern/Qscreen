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
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const JobUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  settings: z.object({}).optional()
});

router.options('/:id', (req, res) => {
  res.set(corsHeaders).status(200).end();
});

// PATCH /admin/jobs/:id - Update job
router.patch('/:id', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'jobs')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for jobs access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = JobUpdateSchema.parse(req.body);

    // Check if job exists and belongs to tenant
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id, tenant_id')
      .eq('id', id)
      .eq('tenant_id', req.authContext!.tenantId)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Job not found'
      });
    }

    // Update job
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', req.authContext!.tenantId);

    if (updateError) {
      logger.error('Error updating job:', updateError);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to update job'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { id }
    });

  } catch (error) {
    logger.error('Error in PATCH /admin/jobs/:id:', error);
    if (error instanceof z.ZodError) {
      return res.status(422).set(corsHeaders).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid job data',
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
