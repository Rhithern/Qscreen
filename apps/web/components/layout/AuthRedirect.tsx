'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AuthRedirectProps {
  redirectTo?: string
  requireAuth?: boolean
}

export function AuthRedirect({ redirectTo = '/dashboard', requireAuth = false }: AuthRedirectProps) {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (requireAuth && !user) {
        router.push('/auth/login')
        return
      }

      if (user && !requireAuth) {
        // User is logged in but on a public auth page - redirect them
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, tenant_id')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'candidate') {
          router.push('/candidate/dashboard')
        } else if (profile?.role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(profile.role)) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      }
    }

    checkAuth()
  }, [router, redirectTo, requireAuth])

  return null
}
