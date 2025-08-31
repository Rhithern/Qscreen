'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function isNonEmpty(v: unknown): v is string { return typeof v === 'string' && v.trim().length > 0 }

export async function createJob(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenant
  const { data: tenantMember } = await supabase
    .from('tenant_members')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantMember) {
    redirect('/onboarding')
  }

  const title = formData.get('title')
  const location = formData.get('location')
  const jd = formData.get('jd')
  const competencies = formData.get('competencies')
  const dueDate = formData.get('due_date')
  const logoUrl = formData.get('logoUrl')
  const primaryColor = formData.get('primaryColor')
  const secondaryColor = formData.get('secondaryColor')

  if (!isNonEmpty(title)) throw new Error('Job title is required')

  try {
    // Parse competencies
    let parsedCompetencies = []
    if (competencies && typeof competencies === 'string') {
      try {
        parsedCompetencies = JSON.parse(competencies)
      } catch {
        parsedCompetencies = []
      }
    }

    // Create brand object
    const brand = {
      logoUrl: logoUrl || null,
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#64748b'
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        tenant_id: tenantMember.tenant_id,
        title,
        location: location || null,
        jd: jd || null,
        competencies: parsedCompetencies,
        due_date: dueDate ? new Date(dueDate as string).toISOString() : null,
        brand,
        status: 'draft',
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/jobs')
    redirect(`/jobs/${job.id}`)
  } catch (error) {
    console.error('Error creating job:', error)
    throw error
  }
}

export async function updateJob(jobId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const title = formData.get('title')
  const location = formData.get('location')
  const jd = formData.get('jd')
  const competencies = formData.get('competencies')
  const dueDate = formData.get('due_date')
  const status = formData.get('status')

  if (!isNonEmpty(title)) throw new Error('Job title is required')

  try {
    let parsedCompetencies = []
    if (competencies && typeof competencies === 'string') {
      try {
        parsedCompetencies = JSON.parse(competencies)
      } catch {
        parsedCompetencies = []
      }
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        title,
        location: location || null,
        jd: jd || null,
        competencies: parsedCompetencies,
        due_date: dueDate ? new Date(dueDate as string).toISOString() : null,
        status: status || 'draft'
      })
      .eq('id', jobId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/jobs')
    revalidatePath(`/jobs/${jobId}`)
  } catch (error) {
    console.error('Error updating job:', error)
    throw error
  }
}

export async function publishJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'live' })
      .eq('id', jobId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/jobs')
    revalidatePath(`/jobs/${jobId}`)
  } catch (error) {
    console.error('Error publishing job:', error)
    throw error
  }
}

export async function closeJob(jobId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  try {
    const { error } = await supabase
      .from('jobs')
      .update({ status: 'closed' })
      .eq('id', jobId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/jobs')
    revalidatePath(`/jobs/${jobId}`)
  } catch (error) {
    console.error('Error closing job:', error)
    throw error
  }
}
