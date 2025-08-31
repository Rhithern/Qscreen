import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Search, Filter, Download, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

async function getResponses(searchParams: { search?: string; status?: string; jobId?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's tenant and role
  const { data: tenantMember } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single()

  if (!tenantMember) {
    redirect('/onboarding')
  }

  let query = supabase
    .from('sessions')
    .select(`
      id,
      status,
      started_at,
      completed_at,
      score,
      candidate_email,
      candidate_name,
      job_id,
      jobs(title, status),
      responses(count)
    `)
    .order('started_at', { ascending: false })

  // For reviewers, show all responses across tenants they have access to
  // For employers, show only their tenant's responses
  if (tenantMember.role !== 'reviewer') {
    query = query.eq('jobs.tenant_id', tenantMember.tenant_id)
  }

  if (searchParams.search) {
    query = query.or(`candidate_name.ilike.%${searchParams.search}%,candidate_email.ilike.%${searchParams.search}%`)
  }

  if (searchParams.status) {
    query = query.eq('status', searchParams.status)
  }

  if (searchParams.jobId) {
    query = query.eq('job_id', searchParams.jobId)
  }

  const { data: sessions } = await query

  return sessions || []
}

export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string; jobId?: string }
}) {
  const responses = await getResponses(searchParams)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Responses</h1>
          <p className="text-muted-foreground">
            Review candidate interview responses and evaluations
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by candidate name or email..."
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
                <DropdownMenuItem>Not Started</DropdownMenuItem>
                <DropdownMenuItem>In Progress</DropdownMenuItem>
                <DropdownMenuItem>Submitted</DropdownMenuItem>
                <DropdownMenuItem>Reviewed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Responses List */}
      {responses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No responses found</h3>
            <p className="text-muted-foreground mb-4">
              {searchParams.search || searchParams.status
                ? 'Try adjusting your search or filters'
                : 'Responses will appear here once candidates complete interviews'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {responses.map((response) => (
            <Card key={response.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {response.candidate_name || response.candidate_email}
                      </h3>
                      <Badge variant={
                        response.status === 'submitted' ? 'default' : 
                        response.status === 'in_progress' ? 'secondary' :
                        response.status === 'reviewed' ? 'outline' : 'destructive'
                      }>
                        {response.status.replace('_', ' ')}
                      </Badge>
                      {response.score && (
                        <Badge variant="outline">
                          Score: {response.score}%
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <span>Job: {response.jobs?.title}</span>
                      {response.started_at && (
                        <span>Started: {new Date(response.started_at).toLocaleDateString()}</span>
                      )}
                      {response.completed_at && (
                        <span>Completed: {new Date(response.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {response.responses?.[0]?.count || 0} responses recorded
                      </span>
                      <span className="text-muted-foreground">
                        Email: {response.candidate_email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {response.status === 'submitted' && (
                      <Link href={`/responses/${response.id}/review`}>
                        <Button size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </Link>
                    )}
                    <Link href={`/responses/${response.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
