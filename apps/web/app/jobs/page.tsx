import { getAccessState } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getJobs(searchParams: { search?: string; status?: string }) {
  const state = await getAccessState()

  if (!state.hasSession) {
    redirect('/auth/login?next=/jobs')
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

  let query = supabase
    .from('jobs')
    .select(`
      id,
      title,
      location,
      status,
      due_date,
      created_at,
      created_by,
      profiles!jobs_created_by_fkey(full_name),
      invites(count),
      sessions(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (searchParams.search) {
    query = query.ilike('title', `%${searchParams.search}%`)
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  const { data: jobs } = await query

  return jobs || []
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const jobs = await getJobs(searchParams)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground">
            Manage your job postings and interviews
          </p>
        </div>
        <Link href="/jobs/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10"
                  defaultValue={searchParams.search}
                  name="search"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>All</DropdownMenuItem>
                <DropdownMenuItem>Draft</DropdownMenuItem>
                <DropdownMenuItem>Live</DropdownMenuItem>
                <DropdownMenuItem>Closed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
            <p className="text-muted-foreground mb-4">
              {searchParams.search || searchParams.status
                ? 'Try adjusting your search or filters'
                : 'Create your first job to start interviewing candidates'}
            </p>
            <Link href="/jobs/create">
              <Button>Create Job</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.title}</h3>
                      <Badge variant={
                        job.status === 'live' ? 'default' : 
                        job.status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      {job.location && (
                        <span>{job.location}</span>
                      )}
                      <span>Created by {job.profiles?.full_name}</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                      {job.due_date && (
                        <span>Due: {new Date(job.due_date).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {job.invites?.[0]?.count || 0} invites sent
                      </span>
                      <span className="text-muted-foreground">
                        {job.sessions?.[0]?.count || 0} responses
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/jobs/${job.id}/edit`}>Edit Job</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/invites/compose?jobId=${job.id}`}>Send Invites</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/responses?jobId=${job.id}`}>View Responses</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
