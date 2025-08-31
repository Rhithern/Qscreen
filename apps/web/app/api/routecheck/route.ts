import { NextRequest, NextResponse } from 'next/server'
import { getAccessState } from '@/lib/auth/server'
import { whyRedirect } from '@/lib/dev/why-redirect'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') || request.nextUrl.pathname

  try {
    const state = await getAccessState()
    const decision = whyRedirect({
      path,
      hasSession: state.hasSession,
      role: state.role,
      tenantId: state.tenantId,
      onboardingCompleted: state.onboardingCompleted
    })

    const result = {
      path,
      ...state,
      decision,
      timestamp: new Date().toISOString()
    }

    // Log to server console for debugging
    console.log(`[routecheck] ${path}: ${decision}`, {
      hasSession: state.hasSession,
      role: state.role,
      tenantId: state.tenantId,
      onboardingCompleted: state.onboardingCompleted
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Route check error:', error)
    return NextResponse.json(
      { error: 'Failed to check route', path },
      { status: 500 }
    )
  }
}
