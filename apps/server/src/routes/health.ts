import { Router, Request, Response } from 'express';
import { createClient } from '../utils/supabase';

export const healthRoutes = Router();

// GET /api/health - Health check
healthRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = await createClient();
    
    // Test database connection
    const { data, error } = await supabase
      .from('tenants')
      .select('count')
      .limit(1);

    const dbHealthy = !error;

    res.json({
      ok: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        api: 'healthy'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});
