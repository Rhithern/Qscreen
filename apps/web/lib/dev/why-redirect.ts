export function whyRedirect(ctx: {
  path: string,
  hasSession: boolean,
  role: string | null,
  tenantId: string | null,
  onboardingCompleted: boolean
}) {
  const { path, hasSession, role, tenantId, onboardingCompleted } = ctx

  // Public routes that don't need auth
  if (path.match(/^\/(_next|auth|invite|api|debug|public|favicon|robots|sitemap|docs|blog|help|pricing|about|careers|contact)/)) {
    return 'allow - public route'
  }

  // Auth routes - redirect if already authenticated
  if (path.startsWith('/auth/') && hasSession) {
    if (role && onboardingCompleted) {
      return 'redirect to /dashboard - already authenticated and onboarded'
    }
    if (role && !onboardingCompleted) {
      return 'redirect to /onboarding - authenticated but not onboarded'
    }
    return 'redirect to /onboarding - authenticated but no role'
  }

  // Employer-only pages
  const employerPages = ['/dashboard', '/jobs', '/question-bank', '/invites', '/responses', '/analytics', '/settings']
  const isEmployerPage = employerPages.some(page => path.startsWith(page))

  if (isEmployerPage) {
    if (!hasSession) {
      return `redirect to /auth/login?next=${path} - no session`
    }
    if (!role || !['owner', 'admin', 'recruiter', 'reviewer'].includes(role)) {
      return 'redirect to /onboarding - no employer role'
    }
    if (!onboardingCompleted) {
      return 'redirect to /onboarding - not onboarded'
    }
    return 'allow - employer with completed onboarding'
  }

  // Onboarding page
  if (path === '/onboarding') {
    if (!hasSession) {
      return 'redirect to /auth/login - no session'
    }
    if (onboardingCompleted && role && ['owner', 'admin', 'recruiter', 'reviewer'].includes(role)) {
      return 'redirect to /dashboard - already onboarded'
    }
    return 'allow - needs onboarding'
  }

  // Candidate pages
  if (path.startsWith('/candidate/') || path.startsWith('/interview/')) {
    if (!hasSession) {
      return `redirect to /auth/login?next=${path} - no session`
    }
    if (role === 'candidate') {
      return 'allow - candidate access'
    }
    return 'redirect to /dashboard - not a candidate'
  }

  // Default allow for other routes
  return 'allow - default'
}
