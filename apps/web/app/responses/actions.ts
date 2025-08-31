'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function saveResponse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const sessionId = formData.get('sessionId') as string
  const questionId = formData.get('questionId') as string
  const transcript = formData.get('transcript') as string
  const audioUrl = formData.get('audioUrl') as string
  const durationSeconds = parseInt(formData.get('durationSeconds') as string)

  if (!sessionId || !questionId || !transcript) {
    throw new Error('Missing required fields')
  }

  // Verify user has access to this session (candidate only)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, candidate_id, status')
    .eq('id', sessionId)
    .eq('candidate_id', user.id)
    .single()

  if (sessionError || !session) {
    throw new Error('Session not found or access denied')
  }

  if (session.status === 'completed') {
    throw new Error('Cannot modify completed session')
  }

  // Save or update response
  const { error } = await supabase
    .from('responses')
    .upsert({
      session_id: sessionId,
      question_id: questionId,
      transcript,
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString()
    })

  if (error) {
    throw new Error(`Failed to save response: ${error.message}`)
  }

  revalidatePath(`/interview/${sessionId}`)
  return { success: true }
}

export async function submitSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user has access to this session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, candidate_id, status')
    .eq('id', sessionId)
    .eq('candidate_id', user.id)
    .single()

  if (sessionError || !session) {
    throw new Error('Session not found or access denied')
  }

  if (session.status === 'completed') {
    throw new Error('Session already completed')
  }

  // Update session status
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to submit session: ${error.message}`)
  }

  revalidatePath('/candidate/dashboard')
  redirect('/candidate/dashboard')
}

export async function evaluateResponse(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const responseId = formData.get('responseId') as string
  const score = parseInt(formData.get('score') as string)
  const notes = formData.get('notes') as string

  if (!responseId || isNaN(score) || score < 1 || score > 10) {
    throw new Error('Invalid evaluation data')
  }

  // Verify user has reviewer access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin', 'recruiter', 'reviewer'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  // Verify response exists and user has access via tenant
  const { data: response, error: responseError } = await supabase
    .from('responses')
    .select(`
      id,
      sessions!inner(
        id,
        jobs!inner(
          id,
          tenant_id
        )
      )
    `)
    .eq('id', responseId)
    .single()

  if (responseError || !response) {
    throw new Error('Response not found')
  }

  if (response.sessions.jobs.tenant_id !== profile.tenant_id) {
    throw new Error('Access denied')
  }

  // Save evaluation
  const { error } = await supabase
    .from('evaluations')
    .upsert({
      response_id: responseId,
      reviewer_id: user.id,
      score,
      notes,
      updated_at: new Date().toISOString()
    })

  if (error) {
    throw new Error(`Failed to save evaluation: ${error.message}`)
  }

  revalidatePath('/responses')
  return { success: true }
}
