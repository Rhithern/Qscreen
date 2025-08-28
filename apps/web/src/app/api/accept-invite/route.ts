import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const acceptInviteSchema = z.object({
  token: z.string().uuid()
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get and validate auth session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/candidate/welcome?error=login_required', request.url))
    }

    // Get and validate token from request body
    const body = await request.json()
    const { token } = acceptInviteSchema.parse(body)

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('id, interview_id, used')
      .eq('token', token)
      .single()

    if (inviteError || !invitation) {
      return NextResponse.redirect(new URL('/candidate/welcome?error=invalid_token', request.url))
    }

    if (invitation.used) {
      return NextResponse.redirect(new URL('/candidate/welcome?error=token_used', request.url))
    }

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('id')
      .eq('interview_id', invitation.interview_id)
      .eq('candidate_id', session.user.id)
      .single()

    if (existingSession) {
      // Mark invitation as used
      await supabase
        .from('invitations')
        .update({ used: true })
        .eq('id', invitation.id)

      return NextResponse.json({ 
        session: existingSession,
        message: 'Existing session found'
      })
    }

    // Create new session
    const { data: newSession, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        interview_id: invitation.interview_id,
        candidate_id: session.user.id,
        status: 'in_progress'
      })
      .select()
      .single()

    if (sessionError || !newSession) {
      return NextResponse.redirect(new URL('/candidate/welcome?error=session_creation_failed', request.url))
    }

    // Mark invitation as used
    await supabase
      .from('invitations')
      .update({ used: true })
      .eq('id', invitation.id)

    return NextResponse.json({ 
      session: newSession,
      message: 'New session created'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.redirect(new URL('/candidate/welcome?error=invalid_token', request.url))
    }
    
    console.error('Error accepting invite:', error)
    return NextResponse.redirect(new URL('/candidate/welcome?error=server_error', request.url))
  }
}
