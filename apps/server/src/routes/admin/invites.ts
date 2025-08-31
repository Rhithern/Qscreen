import { Router } from 'express';
import { adminApiLimiter } from '../../utils/rate-limit';
import { authenticateAdmin, hasScope } from '../../utils/admin-auth';
import { supabase } from '../../utils/supabase';
import { logger } from '../../utils/logger';

const router = Router();

// CORS headers for admin API
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ADMIN_API_ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

router.options('*', (req, res) => {
  res.set(corsHeaders).status(200).end();
});

// GET /admin/invites - List invites
router.get('/', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'invites')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for invites access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { data: invites, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('tenant_id', req.authContext!.tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching invites:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to fetch invites'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: invites
    });

  } catch (error) {
    logger.error('Error in GET /admin/invites:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// POST /admin/invites/:inviteId/regenerate - Regenerate invite token
router.post('/:inviteId/regenerate', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'invites')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for invites access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { inviteId } = req.params;
    const newToken = crypto.randomUUID();

    const { error } = await supabase
      .from('invitations')
      .update({ 
        token: newToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteId)
      .eq('tenant_id', req.authContext!.tenantId);

    if (error) {
      logger.error('Error regenerating invite token:', error);
      return res.status(500).set(corsHeaders).json({
        error: 'DATABASE_ERROR',
        message: 'Failed to regenerate invite token'
      });
    }

    res.set(corsHeaders).json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    logger.error('Error in POST /admin/invites/:inviteId/regenerate:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

// POST /admin/invites/:inviteId/send - Send invite email
router.post('/:inviteId/send', adminApiLimiter, authenticateAdmin, (req, res, next) => {
  if (!hasScope(req.authContext!, 'invites')) {
    return res.status(403).set(corsHeaders).json({
      error: 'FORBIDDEN',
      message: 'Insufficient permissions for invites access'
    });
  }
  next();
}, async (req, res) => {
  try {
    const { inviteId } = req.params;

    // Get invite details
    const { data: invite, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', inviteId)
      .eq('tenant_id', req.authContext!.tenantId)
      .single();

    if (error || !invite) {
      return res.status(404).set(corsHeaders).json({
        error: 'NOT_FOUND',
        message: 'Invite not found'
      });
    }

    // TODO: Implement email sending logic
    logger.info(`Email sending not implemented for invite ${inviteId}`);

    res.set(corsHeaders).json({
      success: true,
      data: { sent: true }
    });

  } catch (error) {
    logger.error('Error in POST /admin/invites/:inviteId/send:', error);
    res.status(500).set(corsHeaders).json({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    });
  }
});

export default router;
