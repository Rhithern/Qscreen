'use server'

import { createClient } from '@/lib/supabase/server'
import { columnExists } from '@/lib/db/columns'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

let hasWarnedOnboardingColumn = false

export async function createCompanyAndTenant(formData: FormData) {
  console.info('[createCompanyAndTenant]', { timestamp: new Date().toISOString() })
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.info('[createCompanyAndTenant]', { userId: null, ok: false, err: 'Not authenticated' })
    redirect('/auth/login')
  }

  const companyName = formData.get('companyName') as string
  const subdomain = formData.get('subdomain') as string
  const logoUrl = formData.get('logoUrl') as string
  const primaryColor = formData.get('primaryColor') as string

  // Validate input
  if (!companyName?.trim()) {
    const error = 'Company name is required'
    console.info('[createCompanyAndTenant]', { userId: user.id, ok: false, err: error })
    throw new Error(error)
  }

  // Note: Subdomain validation removed since column doesn't exist in current schema

  try {
    // Note: Subdomain check removed since column doesn't exist in current schema

    // Create tenant (minimal fields only)
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: companyName.trim()
      })
      .select()
      .single()

    if (tenantError) {
      console.info('[createCompanyAndTenant]', { userId: user.id, ok: false, err: tenantError.message })
      return { error: `Failed to create company: ${tenantError.message}` }
    }

    // Add user to tenant as owner
    const { error: memberError } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner'
      })

    if (memberError) {
      console.info('[createCompanyAndTenant]', { userId: user.id, tenantId: tenant.id, ok: false, err: memberError.message })
      return { error: `Failed to set up company membership: ${memberError.message}` }
    }

    // Check if onboarding_completed column exists and update profile accordingly
    const hasOnboardingColumn = await columnExists('public', 'profiles', 'onboarding_completed')
    
    const profileUpdate: any = {
      role: 'owner',
      tenant_id: tenant.id,
      updated_at: new Date().toISOString()
    }
    
    // Set onboarding_completed = true if column exists
    if (hasOnboardingColumn) {
      profileUpdate.onboarding_completed = true
    } else if (!hasWarnedOnboardingColumn) {
      console.warn('[createCompanyAndTenant] onboarding_completed column missing - continuing without setting it')
      hasWarnedOnboardingColumn = true
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileError) {
      console.info('[createCompanyAndTenant]', { userId: user.id, tenantId: tenant.id, ok: false, err: profileError.message })
      return { error: `Failed to update profile: ${profileError.message}` }
    }

    // Log audit action
    await supabase
      .from('audit_log')
      .insert({
        actor_id: user.id,
        action: 'tenant_created',
        entity_type: 'tenant',
        entity_id: tenant.id,
        meta: {
          company_name: companyName
        }
      })

    console.info('[onboarding] completed', { 
      userId: user.id, 
      tenantId: tenant.id, 
      ok: true, 
      companyName: companyName 
    })

    revalidatePath('/dashboard')
    redirect('/dashboard')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.info('[createCompanyAndTenant]', { userId: user.id, ok: false, err: errorMessage })
    return { error: errorMessage }
  }
}
