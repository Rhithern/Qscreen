import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenant membership and role
  const { data: tenantMember } = await supabase
    .from('tenant_members')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantMember) {
    redirect('/onboarding')
  }

  return { user, tenantMember }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, tenantMember } = await getUser()

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={tenantMember.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
