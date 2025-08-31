import { getAccessState } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const state = await getAccessState()

  if (!state.hasSession) {
    redirect('/auth/login')
  }

  // If user has completed onboarding, redirect to dashboard
  if (state.onboardingCompleted && state.role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(state.role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
