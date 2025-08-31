import { getServerUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { EmployerDashboard } from '@/components/employer/dashboard'

export default async function EmployerPage() {
  const { user, supabase } = await getServerUser()

  if (!user || !supabase) {
    redirect('/auth/login?next=/employer')
  }

  // Verify employer role
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .eq('role', 'employer')
    .single()

  if (!member) {
    redirect('/onboarding')
  }

  // Get interviews with counts
  const { data: interviews } = await supabase
    .from('interviews')
    .select(`
      *,
      questions(count),
      invitations(count),
      sessions(count)
    `)
    .eq('tenant_id', member.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <EmployerDashboard 
      tenant={member.tenants}
      interviews={interviews || []}
    />
  )
}
