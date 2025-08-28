import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TenantProvider } from '@/lib/tenant-context'
import { ThemeProvider } from './theme-provider'
import { getTenantData } from '@/lib/get-tenant-data'
import { AuthProvider } from '@/lib/auth-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interview Platform',
  description: 'Professional online interview platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get tenant data from headers (server-side)
  const tenant = getTenantData()

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TenantProvider tenant={tenant}>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  )
}