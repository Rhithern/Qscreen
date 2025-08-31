'use server'

import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

export async function recordEvaluation(responseId: string, score: number, notes?: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (score < 0 || score > 10) throw new Error('Score must be between 0 and 10')

  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .upsert({
      response_id: responseId,
      reviewer_id: user.id,
      score,
      notes
    })
    .select()
    .single()

  if (error) throw new Error('Failed to record evaluation')

  await logAudit('evaluate', 'response', responseId, { score, notes })
  
  revalidatePath('/hr')
  revalidatePath('/employer')
  return evaluation
}

export async function postComment(interviewId: string, body: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      interview_id: interviewId,
      author_id: user.id,
      body
    })
    .select()
    .single()

  if (error) throw new Error('Failed to post comment')

  await logAudit('comment', 'interview', interviewId, { body })
  
  revalidatePath('/hr')
  revalidatePath('/employer')
  return comment
}
