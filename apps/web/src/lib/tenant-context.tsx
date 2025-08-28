'use client'

import { createContext, useContext, ReactNode } from 'react'
import type { TenantData } from './get-tenant-data'

const TenantContext = createContext<TenantData | null>(null)

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

interface TenantProviderProps {
  tenant: TenantData
  children: ReactNode
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  )
}