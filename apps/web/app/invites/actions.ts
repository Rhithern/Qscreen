'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

interface Candidate {
  email: string
  name: string
  notes?: string
}

export async function createInvites(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const candidatesJson = formData.get('candidates')
  const jobId = formData.get('jobId')
  const expiryDate = formData.get('expiryDate')
  const reminderSchedule = formData.get('reminderSchedule')

  if (!candidatesJson || !jobId || !expiryDate) {
    throw new Error('Missing required fields')
  }

  let candidates: Candidate[] = []
  try {
    candidates = JSON.parse(candidatesJson as string)
  } catch {
    throw new Error('Invalid candidates data')
  }

  if (candidates.length === 0) {
    throw new Error('No candidates provided')
  }

  try {
    // Parse reminder schedule
    const reminders = reminderSchedule 
      ? (reminderSchedule as string).split(',').map(r => r.trim()).filter(Boolean)
      : ['T-72h', 'T-24h', 'T-4h']

    // Create invites
    const invitePromises = candidates.map(candidate => 
      supabase.from('invites').insert({
        job_id: jobId,
        email: candidate.email,
        name: candidate.name,
        notes: candidate.notes || null,
        expires_at: new Date(expiryDate as string).toISOString(),
        reminders: { schedule: reminders }
      })
    )

    const results = await Promise.all(invitePromises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      throw new Error(`Failed to create ${errors.length} invites`)
    }

    // TODO: Send emails here (will implement with Resend later)
    
    revalidatePath('/invites')
    redirect('/invites')
  } catch (error) {
    console.error('Error creating invites:', error)
    throw error
  }
}

export async function regenerateInvite(inviteId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  try {
    // Mark old invite as used and create new one
    const { data: oldInvite } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .single()

    if (!oldInvite) {
      throw new Error('Invite not found')
    }

    // Create new invite with extended expiry
    const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

    const { error } = await supabase.from('invites').insert({
      job_id: oldInvite.job_id,
      email: oldInvite.email,
      name: oldInvite.name,
      notes: oldInvite.notes,
      expires_at: newExpiryDate.toISOString(),
      reminders: oldInvite.reminders
    })

    if (error) {
      throw new Error(error.message)
    }

    // Mark old invite as used
    await supabase
      .from('invites')
      .update({ used: true })
      .eq('id', inviteId)

    revalidatePath('/invites')
  } catch (error) {
    console.error('Error regenerating invite:', error)
    throw error
  }
}
