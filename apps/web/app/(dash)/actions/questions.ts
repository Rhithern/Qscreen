'use server'

import { getServerUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function addQuestion(
  interviewId: string, 
  prompt: string, 
  referenceAnswer?: string
) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  // Get next position
  const { data: lastQuestion } = await supabase
    .from('questions')
    .select('position')
    .eq('interview_id', interviewId)
    .order('position', { ascending: false })
    .limit(1)
    .single()

  const position = (lastQuestion?.position || 0) + 1

  const { data: question, error } = await supabase
    .from('questions')
    .insert({
      interview_id: interviewId,
      prompt,
      reference_answer: referenceAnswer,
      position
    })
    .select()
    .single()

  if (error) throw new Error('Failed to add question')

  console.log(`[ACTION] Added question to interview ${interviewId} by ${user.email}`)
  
  revalidatePath('/employer')
  return question
}

export async function reorderQuestions(interviewId: string, positions: { id: string; position: number }[]) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  // Update positions in a transaction-like manner
  for (const { id, position } of positions) {
    const { error } = await supabase
      .from('questions')
      .update({ position })
      .eq('id', id)
      .eq('interview_id', interviewId)

    if (error) throw new Error('Failed to reorder questions')
  }

  console.log(`[ACTION] Reordered questions for interview ${interviewId} by ${user.email}`)
  
  revalidatePath('/employer')
}

export async function deleteQuestion(id: string) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete question')

  console.log(`[ACTION] Deleted question ${id} by ${user.email}`)
  
  revalidatePath('/employer')
}
