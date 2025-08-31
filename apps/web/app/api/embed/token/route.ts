import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { embedTokenLimiter, withRateLimit } from '@/lib/rate-limit';

const TokenRequestSchema = z.object({
  inviteToken: z.string().min(1)
});

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = withRateLimit(embedTokenLimiter)(request);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: rateLimitResult.headers
      }
    );
  }

  try {
    const body = await request.json();
    const { inviteToken } = TokenRequestSchema.parse(body);

    const supabase = await createClient();

    // Check if using old invitations table or new invites table
    let invite;
    try {
      // Try new invites table first
      const { data: newInvite } = await supabase
        .from('invites')
        .select(`
          id,
          email,
          name,
          used,
          expires_at,
          jobs!inner(
            id,
            title,
            tenants!inner(id, name)
          )
        `)
        .eq('token', inviteToken)
        .single();
      
      if (newInvite) {
        invite = {
          id: newInvite.id,
          email: newInvite.email,
          name: newInvite.name,
          used: newInvite.used,
          expires_at: newInvite.expires_at,
          job_id: newInvite.jobs.id,
          tenant_id: newInvite.jobs.tenants.id
        };
      }
    } catch (error) {
      // Fallback to old invitations table
      const { data: oldInvite } = await supabase
        .from('invitations')
        .select(`
          id,
          candidate_email,
          token,
          used,
          expires_at,
          interview_id,
          interviews!inner(
            tenant_id
          )
        `)
        .eq('token', inviteToken)
        .single();

      if (oldInvite) {
        invite = {
          id: oldInvite.id,
          email: oldInvite.candidate_email,
          used: oldInvite.used,
          expires_at: oldInvite.expires_at,
          interview_id: oldInvite.interview_id,
          tenant_id: oldInvite.interviews.tenant_id
        };
      }
    }

    if (!invite) {
      return NextResponse.json(
        { error: 'Invalid invite token' },
        { status: 404 }
      );
    }

    // Check if invite is already used
    if (invite.used) {
      return NextResponse.json(
        { error: 'Invite token has already been used' },
        { status: 400 }
      );
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: 'Invite token has expired' },
        { status: 400 }
      );
    }

    // Create or get existing session
    let sessionData;
    if (invite.job_id) {
      // New system with jobs
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, job_id, candidate_id')
        .eq('job_id', invite.job_id)
        .eq('candidate_email', invite.email)
        .single();

      if (!session) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('sessions')
          .insert({
            job_id: invite.job_id,
            candidate_email: invite.email,
            candidate_name: invite.name,
            status: 'pending'
          })
          .select('id, job_id, candidate_id')
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
          );
        }
        sessionData = newSession;
      } else {
        sessionData = session;
      }
    } else {
      // Old system with interviews
      const { data: session, error: sessionError } = await supabase
        .from('interview_sessions')
        .select('id, interview_id, candidate_id')
        .eq('interview_id', invite.interview_id)
        .eq('invitation_id', invite.id)
        .single();

      if (!session) {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('interview_sessions')
          .insert({
            interview_id: invite.interview_id,
            invitation_id: invite.id,
            status: 'pending'
          })
          .select('id, interview_id, candidate_id')
          .single();

        if (createError) {
          console.error('Error creating session:', createError);
          return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
          );
        }
        sessionData = newSession;
      } else {
        sessionData = session;
      }
    }

    // Generate short-lived JWT token (5-10 minutes)
    const jwtSecret = process.env.EMBED_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const wsToken = jwt.sign(
      {
        tenant_id: invite.tenant_id,
        session_id: sessionData.id,
        job_id: invite.job_id || null,
        interview_id: invite.interview_id || null,
        candidate_id: sessionData.candidate_id || null,
        invite_id: invite.id,
        exp: Math.floor(Date.now() / 1000) + (7 * 60) // 7 minutes
      },
      jwtSecret
    );

    return NextResponse.json({
      wsToken,
      sessionId: sessionData.id,
      jobId: invite.job_id || null,
      interviewId: invite.interview_id || null,
      candidateId: sessionData.candidate_id || null
    });

  } catch (error) {
    console.error('Error in embed token endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
