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
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const TeamMemberUpdateSchema = z.object({
  role: z.enum(['owner', 'admin', 'member'])
});

router.options('/:userId', (req, res) => {
  res.set(corsHeaders).status(200).end();
});

// PATCH /admin/team/:userId - Update team member role
router.patch('/:userId', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'team')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for team access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = TeamMemberUpdateSchema.parse(req.body);

    // Verify member exists and belongs to tenant
    const { data: existingMember, error: memberError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', req.authContext!.tenantId)
      .eq('user_id', userId)
      .single();

    if (memberError || !existingMember) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Team member not found'
      });
    }

    // Prevent self-demotion from owner role
    if (req.authContext!.userId === userId && existingMember.role === 'owner' && role !== 'owner') {
      return res.status(409).set(corsHeaders).json({
        error: 'CANNOT_DEMOTE_SELF',
        message: 'Cannot demote yourself from owner role'
      });
    }

    // Update member role
    const { error: updateError } = await supabase
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', req.authContext!.tenantId)
      .eq('user_id', userId);

    if (updateError) {
      logger.error('Error updating team member role:', updateError);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to update team member'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { user_id: userId, role }
    });

  } catch (error) {
    logger.error('Error in PATCH /admin/team/:userId:', error);
    if (error instanceof z.ZodError) {
      return res.status(422).set(corsHeaders).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid role data',
        field: 'body'
      });
    }
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// DELETE /admin/team/:userId - Remove team member
router.delete('/:userId', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'team')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for team access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify member exists and belongs to tenant
    const { data: existingMember, error: memberError } = await supabase
      .from('tenant_members')
      .select('id, role')
      .eq('tenant_id', req.authContext!.tenantId)
      .eq('user_id', userId)
      .single();

    if (memberError || !existingMember) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Team member not found'
      });
    }

    // Prevent self-removal
    if (req.authContext!.userId === userId) {
      return res.status(409).set(corsHeaders).json({
        error: 'CANNOT_REMOVE_SELF',
        message: 'Cannot remove yourself from the team'
      });
    }

    // Remove member
    const { error: deleteError } = await supabase
      .from('tenant_members')
      .delete()
      .eq('tenant_id', req.authContext!.tenantId)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error('Error removing team member:', deleteError);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to remove team member'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { user_id: userId, removed: true }
    });

  } catch (error) {
    logger.error('Error in DELETE /admin/team/:userId:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export default router;
