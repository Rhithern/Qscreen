interface TenantTheme {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  logoUrl?: string
  brandName?: string
}

export function applyTenantTheme(theme: TenantTheme) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  if (theme.primaryColor) {
    root.style.setProperty('--primary', theme.primaryColor)
  }
  
  if (theme.secondaryColor) {
    root.style.setProperty('--secondary', theme.secondaryColor)
  }
  
  if (theme.accentColor) {
    root.style.setProperty('--accent', theme.accentColor)
  }
}

export function getTenantFromHeaders() {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  
  // Skip localhost and common development domains
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('vercel.app')) {
    return null
  }

  return {
    subdomain,
    hostname,
  }
}
