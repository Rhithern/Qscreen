import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../supabase';

const router: Router = Router();

// Get responses for authenticated user's jobs
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { job_id } = req.query;

    let query = supabase
      .from('responses')
      .select(`
        *,
        jobs!inner (title, employer_id),
        questions (question_text)
      `)
      .eq('jobs.employer_id', userId);

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data: responses, error } = await query
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ responses });
  } catch (error: any) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch responses' });
  }
});

// Get specific response
router.get('/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user!.id;

    const { data: responses, error } = await supabase
      .from('responses')
      .select(`
        *,
        jobs!inner (title, employer_id),
        questions (question_text)
      `)
      .eq('session_id', sessionId)
      .eq('jobs.employer_id', userId);

    if (error) throw error;

    res.json({ responses });
  } catch (error: any) {
    console.error('Get response error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch response' });
  }
});

export default router;
