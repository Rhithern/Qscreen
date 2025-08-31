import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Helper function to check if column exists
async function columnExists(supabase: any, schema: string, table: string, column: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', schema)
      .eq('table_name', table)
      .eq('column_name', column)
      .single()
    
    return !error && !!data
  } catch (error) {
    return false
  }
}

// Environment validation
const requiredEnvs = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Check if we're missing any required environment variables
const missingEnvs = Object.entries(requiredEnvs)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

let hasWarnedEnv = false
if (missingEnvs.length > 0 && !hasWarnedEnv) {
  console.warn(
    `Missing required environment variables: ${missingEnvs.join(', ')}\n` +
    'Please check your .env file and ensure all required variables are set.\n' +
    'Required variables:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'You can find these values in your Supabase project settings:\n' +
    'https://supabase.com/dashboard/project/_/settings/api'
  )
  hasWarnedEnv = true
}

export async function middleware(request: NextRequest) {
  // Skip auth/tenant check in development if flag is set
  if (process.env.NEXT_PUBLIC_SKIP_TENANT_CHECK === 'true' && process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  let response = NextResponse.next()
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Basic CSP (allow unsafe-inline for dev)
  const csp = process.env.NODE_ENV === 'development' 
    ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: https:;"
    : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' wss: https:;"
  
  response.headers.set('Content-Security-Policy', csp)
  
  // If missing env vars, allow rendering but skip auth logic
  if (missingEnvs.length > 0) {
    return response
  }

  const pathname = request.nextUrl.pathname

  // Skip middleware for excluded paths - updated scope
  if (pathname.match(/^\/(_next|auth|invite|api|debug|public|favicon|robots|sitemap|docs|blog|help|pricing|about|careers|contact)/)) {
    return response
  }
  
  // Create an object to manage the cookies
  const cookieStore = {
    getAll: () => {
      const cookies: { name: string; value: string }[] = []
      for (const cookie of request.cookies.getAll()) {
        cookies.push({ name: cookie.name, value: cookie.value })
      }
      return cookies
    },
    setCookie: (name: string, value: string, options: { path?: string; httpOnly?: boolean; secure?: boolean }) => {
      response.cookies.set({
        name,
        value,
        path: options.path ?? '/',
        httpOnly: options.httpOnly ?? true,
        secure: options.secure ?? process.env.NODE_ENV === 'production',
      })
    },
    deleteCookie: (name: string, options: { path?: string }) => {
      response.cookies.delete({
        name,
        path: options.path ?? '/',
      })
    },
  }

  const supabase = createServerClient(
    requiredEnvs.url!,
    requiredEnvs.key!,
    {
      cookies: cookieStore,
    }
  )

  try {
    // Get session and user profile
    const { data: { session } } = await supabase.auth.getSession()
    
    let userProfile = null
    let onboardingCompleted = false
    
    if (session) {
      // Check if onboarding_completed column exists
      const hasOnboardingColumn = await columnExists(supabase, 'public', 'profiles', 'onboarding_completed')
      
      // Build select query based on column availability
      const selectFields = hasOnboardingColumn 
        ? 'role, tenant_id, onboarding_completed'
        : 'role, tenant_id'
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(selectFields)
        .eq('id', session.user.id)
        .single()
      
      if (!profileError && profile) {
        userProfile = profile as any
        
        // Determine onboarding completion status
        if (hasOnboardingColumn && userProfile.onboarding_completed !== undefined) {
          onboardingCompleted = userProfile.onboarding_completed
        } else if (userProfile.role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(userProfile.role) && userProfile.tenant_id) {
          // Fallback: check tenant membership for employer roles
          const { data: membership } = await supabase
            .from('tenant_members')
            .select('id')
            .eq('tenant_id', userProfile.tenant_id)
            .eq('user_id', session.user.id)
            .single()
          
          onboardingCompleted = !!membership
        }
      }
    }

    // Handle employer-only pages
    const employerPages = ['/dashboard', '/jobs', '/question-bank', '/invites', '/responses', '/analytics', '/settings']
    const isEmployerPage = employerPages.some(page => pathname.startsWith(page))

    if (isEmployerPage) {
      if (!session) {
        console.info(`[middleware] ${pathname}: redirect to login - no session`)
        return NextResponse.redirect(new URL(`/auth/login?next=${encodeURIComponent(pathname)}`, request.url))
      }
      
      if (!userProfile?.role || !['owner', 'admin', 'recruiter', 'reviewer'].includes(userProfile.role)) {
        console.info(`[middleware] ${pathname}: redirect to onboarding - no employer role`)
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      
      if (!onboardingCompleted) {
        console.info(`[middleware] ${pathname}: redirect to onboarding - not completed`)
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
      
      console.info(`[middleware] ${pathname}: allow - employer with completed onboarding`)
    }

    // Handle onboarding page - prevent loop
    if (pathname === '/onboarding') {
      if (!session) {
        console.info(`[middleware] ${pathname}: redirect to login - no session`)
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      
      // If already onboarded, redirect to dashboard
      if (onboardingCompleted && userProfile?.role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(userProfile.role)) {
        console.info(`[middleware] ${pathname}: redirect to dashboard - already onboarded`)
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      
      console.info(`[middleware] ${pathname}: allow - needs onboarding`)
    }

    // Get hostname for tenant resolution
    const hostname = request.headers.get('host') || ''
    const subdomain = hostname.split('.')[0]
    const isCustomDomain = !hostname.includes('localhost') && !hostname.includes('yourdomain.com')

    let tenant = null

    if (isCustomDomain) {
      // Try to find tenant by custom domain
      const { data: domainData } = await supabase
        .from('tenant_domains')
        .select('tenant_id, tenants(*)')
        .eq('domain', hostname)
        .eq('verified', true)
        .single()

      if (domainData) {
        tenant = domainData.tenants
      }
    } else {
      // Try to find tenant by subdomain
      const { data: tenantData } = await supabase
        .from('tenants')
        .select()
        .eq('subdomain', subdomain)
        .single()

      tenant = tenantData
    }

    if (!tenant) {
      // No tenant found - redirect to main site or show error
      if (hostname.includes('localhost')) {
        // In development, allow access without tenant
        response.headers.set('x-tenant-id', 'development')
        return response
      }

      return NextResponse.redirect(new URL('/tenant-not-found', request.url))
    }

    // If we have a session, verify user has access to this tenant
    if (session) {
      const { data: membership } = await supabase
        .from('tenant_members')
        .select()
        .eq('tenant_id', tenant.id)
        .eq('user_id', session.user.id)
        .single()

      if (!membership) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // Add user's role to the headers
      response.headers.set('x-tenant-role', membership.role)
    }

    // Add tenant info to headers
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-name', tenant.name)
    response.headers.set('x-tenant-theme', JSON.stringify(tenant.theme))
    if (tenant.logo_url) {
      response.headers.set('x-tenant-logo', tenant.logo_url)
    }

    return response

  } catch (error) {
    console.error('Error in middleware:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

// Configure paths that need tenant resolution
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public/*)
     * - public API routes (/api/public/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/public/).*)',
  ],
}
