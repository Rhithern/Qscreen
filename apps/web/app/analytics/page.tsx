import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Users, Clock, Download } from 'lucide-react'

async function getAnalyticsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenant
  const { data: tenantMember } = await supabase
    .from('tenant_members')
    .select('tenant_id, tenants(name)')
    .eq('user_id', user.id)
    .single()

  if (!tenantMember) {
    redirect('/onboarding')
  }

  const tenantId = tenantMember.tenant_id

  // Get analytics data
  const [jobsResult, invitesResult, sessionsResult, responsesResult] = await Promise.all([
    supabase.from('jobs').select('id, title, status, created_at').eq('tenant_id', tenantId),
    supabase.from('invites').select('id, used, created_at, job_id'),
    supabase.from('sessions').select('id, status, started_at, completed_at, score, job_id'),
    supabase.from('responses').select('id, created_at, session_id')
  ])

  const jobs = jobsResult.data || []
  const invites = invitesResult.data || []
  const sessions = sessionsResult.data || []
  const responses = responsesResult.data || []

  // Calculate metrics
  const totalJobs = jobs.length
  const activeJobs = jobs.filter(j => j.status === 'live').length
  const totalInvites = invites.length
  const usedInvites = invites.filter(i => i.used).length
  const totalSessions = sessions.length
  const completedSessions = sessions.filter(s => s.status === 'submitted').length
  const avgScore = completedSessions.length > 0 
    ? Math.round(sessions.filter(s => s.score).reduce((acc, s) => acc + s.score, 0) / sessions.filter(s => s.score).length)
    : 0

  // Time-based metrics (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentInvites = invites.filter(i => new Date(i.created_at) > thirtyDaysAgo).length
  const recentSessions = sessions.filter(s => s.started_at && new Date(s.started_at) > thirtyDaysAgo).length

  return {
    tenant: tenantMember.tenants,
    metrics: {
      totalJobs,
      activeJobs,
      totalInvites,
      usedInvites,
      inviteUsageRate: totalInvites > 0 ? Math.round((usedInvites / totalInvites) * 100) : 0,
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
      avgScore,
      recentInvites,
      recentSessions
    },
    jobs,
    sessions: sessions.slice(0, 10) // Recent sessions
  }
}

export default async function AnalyticsPage() {
  const { tenant, metrics, jobs, sessions } = await getAnalyticsData()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and insights for {tenant?.name}
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.totalJobs} total jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invite Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inviteUsageRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.usedInvites} of {metrics.totalInvites} invites used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.completedSessions} of {metrics.totalSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgScore}%</div>
            <p className="text-xs text-muted-foreground">
              Across all completed interviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (30 days)</CardTitle>
            <CardDescription>
              Overview of recent interview activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Invites Sent</span>
              <Badge variant="outline">{metrics.recentInvites}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sessions Started</span>
              <Badge variant="outline">{metrics.recentSessions}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Jobs</span>
              <Badge variant="outline">{metrics.activeJobs}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Jobs</CardTitle>
            <CardDescription>
              Jobs with highest completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No job data available yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(job.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={job.status === 'live' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interview Sessions</CardTitle>
          <CardDescription>
            Latest candidate interview activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No interview sessions yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {session.candidate_name || session.candidate_email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.started_at 
                        ? `Started ${new Date(session.started_at).toLocaleDateString()}`
                        : 'Not started'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {session.score && (
                      <Badge variant="outline">
                        {session.score}%
                      </Badge>
                    )}
                    <Badge variant={
                      session.status === 'submitted' ? 'default' :
                      session.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {session.status.replace('_', ' ')}
                    </Badge>
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
