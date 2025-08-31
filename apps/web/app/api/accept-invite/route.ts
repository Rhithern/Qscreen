import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Validate invitation token
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select(`
        *,
        interviews(*)
      `)
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // If user is logged in as candidate, create/attach session
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role === 'candidate') {
        // Check if session already exists
        let { data: existingSession } = await supabase
          .from('interview_sessions')
          .select('*')
          .eq('interview_id', invitation.interview_id)
          .eq('candidate_id', session.user.id)
          .single()

        if (!existingSession) {
          // Create new session
          const { data: newSession, error: sessionError } = await supabase
            .from('interview_sessions')
            .insert({
              interview_id: invitation.interview_id,
              candidate_id: session.user.id,
              invitation_id: invitation.id,
              status: 'pending'
            })
            .select(`
              *,
              interviews(title, description)
            `)
            .single()

          if (sessionError) {
            return NextResponse.json(
              { error: 'Failed to create session' },
              { status: 500 }
            )
          }

          existingSession = newSession
        }

        // Mark invitation as used
        await supabase
          .from('invitations')
          .update({ used: true })
          .eq('id', invitation.id)

        return NextResponse.json({
          session: existingSession,
          message: 'Invitation accepted successfully'
        })
      }
    }

    // For non-authenticated users or non-candidates, return invitation info
    return NextResponse.json({
      invitation: {
        interview_id: invitation.interview_id,
        interview: invitation.interviews,
        candidate_email: invitation.candidate_email
      },
      requiresAuth: !session || !session.user,
      message: 'Please sign in as a candidate to accept this invitation'
    })

  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
