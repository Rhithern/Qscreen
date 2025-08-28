import { headers } from 'next/headers'

export interface TenantTheme {
  colors: {
    primary: string
    background: string
    text: string
  }
}

export interface TenantData {
  id: string
  name: string
  theme: TenantTheme
  logoUrl?: string
  role?: string
}

export function getTenantData(): TenantData {
  const headersList = headers()
  
  return {
    id: headersList.get('x-tenant-id') || 'development',
    name: headersList.get('x-tenant-name') || 'Development',
    theme: headersList.get('x-tenant-theme') 
      ? JSON.parse(headersList.get('x-tenant-theme')!)
      : {
          colors: {
            primary: '#2563eb',
            background: '#ffffff',
            text: '#111827'
          }
        },
    logoUrl: headersList.get('x-tenant-logo') || undefined,
    role: headersList.get('x-tenant-role') || undefined
  }
}
