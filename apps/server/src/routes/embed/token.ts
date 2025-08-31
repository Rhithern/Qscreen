import express, { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../../supabase';
import { config } from '../../config';

const router: Router = express.Router();

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Request schema
const tokenRequestSchema = z.object({
  inviteToken: z.string().min(1, 'Invite token is required'),
  origin: z.string().url('Valid origin URL is required').optional()
});

// Rate limiting middleware
const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute per IP

  // Clean up expired entries
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }

  const clientData = rateLimitStore.get(clientIp);
  
  if (!clientData) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  if (now > clientData.resetTime) {
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + windowMs });
    next();
    return;
  }

  if (clientData.count >= maxRequests) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
    return;
  }

  clientData.count++;
  next();
};

// POST /api/embed/token - Generate embed token
router.post('/', rateLimit, async (req, res) => {
  try {
    const { inviteToken, origin } = tokenRequestSchema.parse(req.body);

    // Validate invite token and get interview session
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(`
        id,
        candidate_email,
        status,
        expires_at,
        job:jobs (
          id,
          title,
          employer_id,
          status
        )
      `)
      .eq('token', inviteToken)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({ error: 'Invalid or expired invite token' });
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Invitation has expired' });
    }

    // Check if job is still active
    if (invitation.job.status !== 'active') {
      return res.status(410).json({ error: 'Job is no longer active' });
    }

    // Validate origin if provided
    if (origin) {
      const allowedOrigins = config.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      const originUrl = new URL(origin);
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
          const domain = allowed.slice(2);
          return originUrl.hostname.endsWith(domain);
        }
        return originUrl.origin === allowed;
      });

      if (!isAllowed) {
        return res.status(403).json({ error: 'Origin not allowed' });
      }
    }

    // Create or get interview session
    let sessionId: string;
    const { data: existingSession } = await supabase
      .from('interview_sessions')
      .select('id')
      .eq('invitation_id', invitation.id)
      .eq('status', 'pending')
      .single();

    if (existingSession) {
      sessionId = existingSession.id;
    } else {
      const { data: newSession, error: sessionError } = await supabase
        .from('interview_sessions')
        .insert({
          invitation_id: invitation.id,
          job_id: invitation.job.id,
          candidate_email: invitation.candidate_email,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        throw new Error('Failed to create interview session');
      }
      sessionId = newSession.id;
    }

    // Generate short-lived JWT token for embed session
    const embedToken = jwt.sign(
      {
        sessionId,
        invitationId: invitation.id,
        jobId: invitation.job.id,
        candidateEmail: invitation.candidate_email,
        origin: origin || null,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (10 * 60) // 10 minutes
      },
      config.EMBED_JWT_SECRET,
      { algorithm: 'HS256' }
    );

    res.json({
      token: embedToken,
      sessionId,
      expiresIn: 600, // 10 minutes in seconds
      job: {
        id: invitation.job.id,
        title: invitation.job.title
      }
    });

  } catch (error: any) {
    console.error('Embed token generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
