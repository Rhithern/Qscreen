'use server'

import { getServerUser } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function createInterview(title: string) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  // Get user's tenant and verify employer role
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!member) throw new Error('Only employers can create interviews')

  const { data: interview, error } = await supabase
    .from('interviews')
    .insert({
      title,
      tenant_id: member.tenant_id,
      created_by: user.id,
      status: 'draft'
    })
    .select()
    .single()

  if (error) throw new Error('Failed to create interview')

  console.log(`[ACTION] Created interview: ${interview.id} by ${user.email}`)
  
  revalidatePath('/employer')
  return interview
}

export async function updateInterviewStatus(id: string, status: 'draft' | 'open' | 'closed') {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  const { data: interview, error } = await supabase
    .from('interviews')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update interview status')

  console.log(`[ACTION] Updated interview status: ${id} to ${status} by ${user.email}`)
  
  revalidatePath('/employer')
  return interview
}

export async function deleteInterview(id: string) {
  const { user, supabase } = await getServerUser()
  
  if (!user || !supabase) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete interview')

  console.log(`[ACTION] Deleted interview: ${id} by ${user.email}`)
  
  revalidatePath('/employer')
}
