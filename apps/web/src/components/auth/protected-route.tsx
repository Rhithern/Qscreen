'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-provider'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('employer' | 'hr' | 'candidate')[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated, redirect to sign in
      if (!user) {
        router.push(`/auth/sign-in?returnUrl=${encodeURIComponent(pathname)}`)
        return
      }

      // If roles are specified, check if user has required role
      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.push('/unauthorized')
        return
      }
    }
  }, [user, profile, isLoading, router, pathname, allowedRoles])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If authentication is complete and user has required role, render children
  if (!isLoading && user && (!allowedRoles || (profile && allowedRoles.includes(profile.role)))) {
    return <>{children}</>
  }

  // Don't render anything while redirecting
  return null
}
