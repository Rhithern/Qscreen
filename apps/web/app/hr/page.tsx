import { getServerUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { HRDashboard } from '@/components/hr/dashboard'

export default async function HRPage() {
  const { user, supabase } = await getServerUser()

  if (!user || !supabase) {
    redirect('/auth/login?next=/hr')
  }

  // Verify HR role and get assignments
  const { data: member } = await supabase
    .from('tenant_members')
    .select('tenant_id, role, tenants(*)')
    .eq('user_id', user.id)
    .eq('role', 'hr')
    .single()

  if (!member) {
    redirect('/onboarding')
  }

  // Get assigned interviews
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      *,
      interviews(
        *,
        sessions(
          *,
          candidate:profiles(full_name, email),
          responses(
            *,
            question:questions(prompt),
            evaluations(score, notes, reviewer:profiles(full_name))
          )
        )
      )
    `)
    .eq('reviewer_id', user.id)

  return <HRDashboard tenant={member.tenants} assignments={assignments || []} />
}
