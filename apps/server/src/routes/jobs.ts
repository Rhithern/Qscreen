import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { supabase } from '../supabase';
import { z } from 'zod';

const router: Router = Router();

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  questions: z.array(z.string().min(1)),
});

// Create a new job
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, description, questions } = createJobSchema.parse(req.body);
    const userId = req.user!.id;

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title,
        description,
        employer_id: userId,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Create questions
    const questionsData = questions.map((question, index) => ({
      job_id: job.id,
      question_text: question,
      position: index + 1,
      created_at: new Date().toISOString(),
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData);

    if (questionsError) throw questionsError;

    res.status(201).json({ job, message: 'Job created successfully' });
  } catch (error: any) {
    console.error('Create job error:', error);
    res.status(400).json({ error: error.message || 'Failed to create job' });
  }
});

// Get all jobs for the authenticated user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        questions (*)
      `)
      .eq('employer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ jobs });
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch jobs' });
  }
});

// Get a specific job
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        questions (*),
        invitations (*)
      `)
      .eq('id', id)
      .eq('employer_id', userId)
      .single();

    if (error) throw error;

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch job' });
  }
});

export default router;
