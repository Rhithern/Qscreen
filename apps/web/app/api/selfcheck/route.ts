import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('[API] /api/selfcheck - Health check requested')
  
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let userRole = null
    let tenant = null
    let conductorHealth = null

    if (user) {
      // Get user role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      userRole = profile?.role || null

      // Get tenant info
      const { data: member } = await supabase
        .from('tenant_members')
        .select('tenant_id, tenants!inner(id, name, subdomain)')
        .eq('user_id', user.id)
        .single()
      
      if (member?.tenants && !Array.isArray(member.tenants)) {
        tenant = {
          id: member.tenants.id,
          name: member.tenants.name,
          subdomain: member.tenants.subdomain
        }
      }
    }

    // Check conductor health
    try {
      const conductorResponse = await fetch('http://localhost:8787/health', { 
        signal: AbortSignal.timeout(5000) 
      })
      if (conductorResponse.ok) {
        conductorHealth = await conductorResponse.json()
      }
    } catch {
      conductorHealth = { ok: false, error: 'Conductor unreachable' }
    }

    const response = {
      ok: true,
      userRole,
      tenant,
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
      },
      conductorHealth,
      embed: {
        hasJwtSecret: !!(process.env.EMBED_JWT_SECRET || process.env.NEXTAUTH_SECRET),
        configOk: !!(process.env.NEXT_PUBLIC_CONDUCTOR_URL && process.env.NEXT_PUBLIC_APP_URL)
      }
    }

    console.log(`[API] /api/selfcheck - User: ${user?.email || 'none'}, Role: ${userRole || 'none'}`)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] /api/selfcheck - Error:', error)
    
    return NextResponse.json({
      ok: false,
      userRole: null,
      tenant: null,
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
      },
      conductorHealth: null,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
