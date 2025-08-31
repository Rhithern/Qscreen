'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface Tenant {
  id: string
  name: string
  subdomain: string
  theme: any
  logo_url?: string
}

interface TenantContextType {
  tenant: Tenant | null
  loading: boolean
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get tenant info from headers set by middleware
    const tenantId = document.querySelector('meta[name="x-tenant-id"]')?.getAttribute('content')
    const tenantName = document.querySelector('meta[name="x-tenant-name"]')?.getAttribute('content')
    const tenantTheme = document.querySelector('meta[name="x-tenant-theme"]')?.getAttribute('content')
    const tenantLogo = document.querySelector('meta[name="x-tenant-logo"]')?.getAttribute('content')

    if (tenantId && tenantName) {
      setTenant({
        id: tenantId,
        name: tenantName,
        subdomain: window.location.hostname.split('.')[0],
        theme: tenantTheme ? JSON.parse(tenantTheme) : {},
        logo_url: tenantLogo || undefined,
      })
    }
    setLoading(false)
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, loading }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
