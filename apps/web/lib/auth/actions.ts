'use server'

import { createClient } from '@/lib/supabase/server'
import { getRoleTenantState } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

function isEmail(v: unknown): v is string { return typeof v === 'string' && /\S+@\S+\.\S+/.test(v) }
function isNonEmpty(v: unknown): v is string { return typeof v === 'string' && v.trim().length > 0 }
function isEmployerRole(v: unknown): v is 'owner' | 'admin' | 'recruiter' { return v === 'owner' || v === 'admin' || v === 'recruiter' }

export async function signUp(formData: FormData) {
  // Alias for backward compatibility
  return signUpEmployer(formData)
}

export async function signUpEmployer(formData: FormData) {
  console.info('[signUpEmployer]', { timestamp: new Date().toISOString() })
  
  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const companyName = formData.get('companyName') as string
  
  if (!email || !password || !fullName) {
    const error = 'Email, password, and full name are required'
    console.info('[signUpEmployer]', { email, ok: false, err: error })
    throw new Error(error)
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
          role: 'employer'
        }
      }
    })

    if (error) {
      console.info('[signUpEmployer]', { email, ok: false, err: error.message })
      throw new Error(error.message)
    }

    if (data.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: 'employer'
        })

      if (profileError) {
        console.info('[signUpEmployer]', { userId: data.user.id, ok: false, err: profileError.message })
        console.error('Profile creation error:', profileError)
      } else {
        console.info('[signUpEmployer]', { userId: data.user.id, email, ok: true })
      }
    }

    redirect('/onboarding')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.info('[signUpEmployer]', { email, ok: false, err: errorMessage })
    throw error
  }
}

function getRedirectUrl(role: string | null, onboardingCompleted: boolean, nextUrl?: string): string {
  // Check if nextUrl is allowed for this role
  const allowedPaths = {
    'owner': ['/dashboard', '/jobs', '/question-bank', '/invites', '/responses', '/analytics', '/settings'],
    'admin': ['/dashboard', '/jobs', '/question-bank', '/invites', '/responses', '/analytics', '/settings'],
    'recruiter': ['/dashboard', '/jobs', '/question-bank', '/invites', '/responses', '/analytics', '/settings'],
    'reviewer': ['/responses'],
    'candidate': ['/dashboard']
  }

  if (nextUrl && role && allowedPaths[role as keyof typeof allowedPaths]?.some(path => nextUrl.startsWith(path))) {
    return nextUrl
  }

  // Default redirects by role
  switch (role) {
    case 'owner':
    case 'admin':
    case 'recruiter':
      return onboardingCompleted ? '/dashboard' : '/onboarding'
    case 'reviewer':
      return '/responses'
    case 'candidate':
      return '/dashboard'
    default:
      return '/onboarding'
  }
}

export async function signIn(formData: FormData) {
  console.info('[signIn]', { timestamp: new Date().toISOString() })
  
  const supabase = await createClient()
  const email = formData.get('email')
  const password = formData.get('password')
  const next = formData.get('next') as string | undefined

  if (!isEmail(email)) {
    console.info('[signIn]', { email, ok: false, err: 'Valid email is required' })
    return { error: 'Valid email is required' }
  }
  if (!isNonEmpty(password)) {
    console.info('[signIn]', { email, ok: false, err: 'Password is required' })
    return { error: 'Password is required' }
  }

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      console.info('[signIn]', { email, ok: false, err: error.message })
      return { error: error.message }
    }

    // Get role and tenant state using the new helper
    const { role, tenantId, onboardingCompleted } = await getRoleTenantState()
    
    console.info('[signIn]', { 
      userId: authData.user.id, 
      email, 
      role, 
      tenantId, 
      onboardingCompleted, 
      next,
      ok: true 
    })
    
    // Special handling for candidates
    if (role === 'candidate' && !tenantId) {
      return { error: 'Please use your invite link to access the platform' }
    }
    
    // Determine redirect URL
    const redirectUrl = getRedirectUrl(role, onboardingCompleted, next)
    
    console.info('[signIn]', { userId: authData.user.id, redirectUrl })
    redirect(redirectUrl)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.info('[signIn]', { email, ok: false, err: errorMessage })
    return { error: errorMessage }
  }
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  
  // Call the database function to handle invite acceptance
  const { data, error } = await supabase.rpc('accept_invite', { invite_token: token })
  
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  
  return data
}

export async function signOut() {
  const supabase = await createClient()  // 👈 await
  await supabase.auth.signOut()
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()  // 👈 await
  const email = formData.get('email')
  if (!isEmail(email)) throw new Error('Valid email is required')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${baseUrl}/auth/reset/confirm` })
  if (error) throw new Error(error.message)
  return { success: true }
}
