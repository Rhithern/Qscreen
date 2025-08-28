'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { useAuth } from '@/lib/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  allowedRoles?: ('employer' | 'hr' | 'candidate')[]
}

export function AuthenticatedLayout({ children, allowedRoles }: AuthenticatedLayoutProps) {
  const { profile } = useAuth()

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          {profile && <Sidebar />}
          <main className={`flex-1 ${profile ? 'lg:pl-64' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
