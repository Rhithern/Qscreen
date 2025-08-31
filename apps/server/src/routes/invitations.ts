import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../supabase';
import { z } from 'zod';

const router: Router = Router();

const createInvitationSchema = z.object({
  job_id: z.string().uuid(),
  candidate_email: z.string().email(),
});

// Create invitation
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { job_id, candidate_email } = createInvitationSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', job_id)
      .eq('employer_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        job_id,
        candidate_email,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ invitation, message: 'Invitation sent successfully' });
  } catch (error: any) {
    console.error('Create invitation error:', error);
    res.status(400).json({ error: error.message || 'Failed to create invitation' });
  }
});

// Get invitations for authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(`
        *,
        jobs (title, description)
      `)
      .eq('jobs.employer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ invitations });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch invitations' });
  }
});

export default router;
