'use server'

import { getServerUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function inviteCandidate(interviewId: string, email: string) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex')

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      interview_id: interviewId,
      candidate_email: email,
      token,
      used: false
    })
    .select()
    .single()

  if (error) throw new Error('Failed to create invitation')

  console.log(`[ACTION] Invited candidate ${email} to interview ${interviewId} by ${user.email}`)
  
  revalidatePath('/employer')
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return {
    invitation,
    inviteUrl: `${baseUrl}/candidate?token=${token}`
  }
}

export async function assignHR(interviewId: string, hrEmail: string) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  // Find HR user by email in the same tenant
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!member) throw new Error('Only employers can assign HR')

  const { data: hrUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', hrEmail)
    .single()

  if (!hrUser) throw new Error('HR user not found')

  // Verify HR user is in the same tenant
  const { data: hrMember } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('user_id', hrUser.id)
    .eq('tenant_id', member.tenant_id)
    .eq('role', 'hr')
    .single()

  if (!hrMember) throw new Error('User is not an HR member of this tenant')

  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({
      interview_id: interviewId,
      reviewer_id: hrUser.id
    })
    .select()
    .single()

  if (error) throw new Error('Failed to assign HR reviewer')

  console.log(`[ACTION] Assigned HR ${hrEmail} to interview ${interviewId} by ${user.email}`)
  
  revalidatePath('/employer')
  return assignment
}
