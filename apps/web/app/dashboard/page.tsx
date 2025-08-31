import { getAccessState } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Users, FileText, Send, BarChart3 } from 'lucide-react'

async function getDashboardData() {
  const state = await getAccessState()

  if (!state.hasSession) {
    redirect('/auth/login?next=/dashboard')
  }

  if (!state.role || !['owner', 'admin', 'recruiter', 'reviewer'].includes(state.role)) {
    redirect('/onboarding')
  }

  if (!state.onboardingCompleted) {
    redirect('/onboarding')
  }

  const supabase = await createClient()
  const tenantId = state.tenantId

  if (!tenantId) {
    redirect('/onboarding')
  }

  // Get tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  // Get funnel metrics
  const [jobsResult, invitesResult, sessionsResult] = await Promise.all([
    supabase.from('jobs').select('id, title, status').eq('tenant_id', tenantId),
    supabase.from('invites').select('id, used, job_id'),
    supabase.from('sessions').select('id, status, job_id')
  ])

  const jobs = jobsResult.data || []
  const invites = invitesResult.data || []
  const sessions = sessionsResult.data || []

  // Calculate metrics
  const totalInvited = invites.length
  const totalStarted = sessions.filter(s => s.status !== 'not_started').length
  const totalSubmitted = sessions.filter(s => s.status === 'submitted').length

  return {
    tenant,
    jobs,
    metrics: {
      totalInvited,
      totalStarted,
      totalSubmitted,
      conversionRate: totalInvited > 0 ? Math.round((totalSubmitted / totalInvited) * 100) : 0
    }
  }
}

export default async function DashboardPage() {
  const { tenant, jobs, metrics } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to {tenant?.name}
          </p>
        </div>
      </div>

      {/* Funnel Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invited</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalInvited}</div>
            <p className="text-xs text-muted-foreground">
              Candidates invited to interviews
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Started</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStarted}</div>
            <p className="text-xs text-muted-foreground">
              Candidates who began interviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalSubmitted}</div>
            <p className="text-xs text-muted-foreground">
              Completed interviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Invited to submitted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Link href="/jobs/create">
            <Button className="w-full h-20 flex flex-col gap-2">
              <Plus className="h-6 w-6" />
              Create New Job
            </Button>
          </Link>
          <Link href="/invites/compose">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
              <Send className="h-6 w-6" />
              Invite Candidates
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>
              Your latest job postings
            </CardDescription>
          </div>
          <Link href="/jobs">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first job to start interviewing candidates
              </p>
              <Link href="/jobs/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{job.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      job.status === 'live' ? 'default' : 
                      job.status === 'draft' ? 'secondary' : 'outline'
                    }>
                      {job.status}
                    </Badge>
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
