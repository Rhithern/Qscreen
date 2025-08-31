import { NextResponse } from 'next/server'
import { columnExists } from '@/lib/db/columns'

export async function GET() {
  try {
    const hasOnboardingCompleted = await columnExists('public', 'profiles', 'onboarding_completed')
    
    const result = {
      hasOnboardingCompleted,
      timestamp: new Date().toISOString()
    }

    console.info('[db/meta]', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Database meta check error:', error)
    return NextResponse.json(
      { error: 'Failed to check database meta', hasOnboardingCompleted: false },
      { status: 500 }
    )
  }
}
