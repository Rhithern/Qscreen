import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('[API] /api/dbcheck - Database RLS check requested')
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Test RLS by trying to access a protected table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    // Test tenant access
    const { data: tenantsData, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)

    // Test with auth if user is present
    let authorizedTest = null
    if (user) {
      const { data: authorizedData, error: authorizedError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()
      
      authorizedTest = {
        success: !authorizedError,
        hasData: !!authorizedData,
        error: authorizedError?.message
      }
    }

    const response = {
      ok: true,
      rls: {
        profiles: {
          blocked: !!profilesError,
          error: profilesError?.message,
          dataReturned: !!profilesData?.length
        },
        tenants: {
          blocked: !!tenantsError,
          error: tenantsError?.message,
          dataReturned: !!tenantsData?.length
        },
        authorized: authorizedTest
      },
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString()
    }

    console.log(`[API] /api/dbcheck - RLS profiles: ${!!profilesError}, tenants: ${!!tenantsError}, User: ${user?.email || 'none'}`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] /api/dbcheck - Error:', error)
    
    return NextResponse.json({
      ok: false,
      error: 'Database check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
