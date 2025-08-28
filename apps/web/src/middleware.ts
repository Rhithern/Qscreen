import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Environment validation
const requiredEnvs = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}

// Check if we're missing any required environment variables
const missingEnvs = Object.entries(requiredEnvs)
  .filter(([_, value]) => !value)
  .map(([key]) => key)

if (missingEnvs.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvs.join(', ')}\n` +
    'Please check your .env file and ensure all required variables are set.\n' +
    'Required variables:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'You can find these values in your Supabase project settings:\n' +
    'https://supabase.com/dashboard/project/_/settings/api'
  )
}

export async function middleware(request: NextRequest) {
  // Skip auth/tenant check in development if flag is set
  if (process.env.NEXT_PUBLIC_SKIP_TENANT_CHECK === 'true' && process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  let response = NextResponse.next()
  
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
    requiredEnvs.url,
    requiredEnvs.key,
    {
      cookies: cookieStore,
    }
  )

  // Get session
  const { data: { session } } = await supabase.auth.getSession()

  // Get hostname
  const hostname = request.headers.get('host') || ''
  const subdomain = hostname.split('.')[0]
  const isCustomDomain = !hostname.includes('localhost') && !hostname.includes('yourdomain.com')

  // Skip tenant resolution for public routes
  const isPublicRoute = request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/static') ||
    request.nextUrl.pathname.startsWith('/api/public')
  
  if (isPublicRoute) {
    return response
  }

  try {
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
    console.error('Error in tenant middleware:', error)
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
