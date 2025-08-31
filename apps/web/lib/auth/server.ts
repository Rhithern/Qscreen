import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { columnExists } from '@/lib/db/columns'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getServerUser() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // NO cookie writes here - read-only helper
        },
        remove(name: string, options: any) {
          // NO cookie writes here - read-only helper
        },
      },
    })

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Auth error in getServerUser:', error.message)
      return { user: null, supabase }
    }

    return { user, supabase }
  } catch (error) {
    console.error('Failed to get server user:', error)
    return { user: null, supabase: null }
  }
}

export async function getRoleTenantState() {
  try {
    const { user, supabase } = await getServerUser()
    if (!user || !supabase) {
      return { 
        hasSession: false, 
        role: null, 
        tenantId: null, 
        onboardingCompleted: false 
      }
    }

    // Check if onboarding_completed column exists
    const hasOnboardingColumn = await columnExists('public', 'profiles', 'onboarding_completed')
    
    // Get profile with role and tenant status - always try to get onboarding_completed
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return { 
        hasSession: true, 
        role: null, 
        tenantId: null, 
        onboardingCompleted: false 
      }
    }

    // Determine onboarding completion status
    let onboardingCompleted = false
    
    if (hasOnboardingColumn && (profile as any).onboarding_completed !== undefined) {
      // Use the column value if available
      onboardingCompleted = (profile as any).onboarding_completed
    } else if (profile.role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(profile.role) && profile.tenant_id) {
      // Fallback: check tenant membership for employer roles
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', user.id)
        .single()
      
      onboardingCompleted = !!membership
    }

    return {
      hasSession: true,
      role: profile.role,
      tenantId: profile.tenant_id,
      onboardingCompleted
    }
  } catch (error) {
    console.error('Failed to get role tenant state:', error)
    return { 
      hasSession: false, 
      role: null, 
      tenantId: null, 
      onboardingCompleted: false 
    }
  }
}

// Legacy alias for getRoleTenantState
export async function getAccessState() {
  return getRoleTenantState()
}
