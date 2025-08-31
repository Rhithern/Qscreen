import { getAccessState } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Send, Clock, CheckCircle, XCircle } from 'lucide-react'

async function getInvites() {
  const state = await getAccessState()

  if (!state.hasSession) {
    redirect('/auth/login?next=/invites')
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

  const { data: invites } = await supabase
    .from('invites')
    .select(`
      id,
      email,
      name,
      used,
      expires_at,
      created_at,
      jobs!inner(
        id,
        title,
        tenant_id
      )
    `)
    .eq('jobs.tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return invites || []
}

export default async function InvitesPage() {
  const invites = await getInvites()

  const pendingInvites = invites.filter(i => !i.used && new Date(i.expires_at) > new Date())
  const usedInvites = invites.filter(i => i.used)
  const expiredInvites = invites.filter(i => !i.used && new Date(i.expires_at) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground">
            Manage candidate invitations and magic links
          </p>
        </div>
        <Link href="/invites/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Compose Invites
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invites.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usedInvites.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredInvites.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No invites sent yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by composing your first candidate invitation
            </p>
            <Link href="/invites/compose">
              <Button>Compose Invites</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Invites</CardTitle>
            <CardDescription>
              All candidate invitations and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invites.map((invite) => {
                const isExpired = new Date(invite.expires_at) <= new Date()
                const status = invite.used ? 'accepted' : isExpired ? 'expired' : 'pending'
                
                return (
                  <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium">{invite.name || invite.email}</h4>
                        <Badge variant={
                          status === 'accepted' ? 'default' : 
                          status === 'expired' ? 'destructive' : 'secondary'
                        }>
                          {status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Job: {invite.jobs?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(invite.expires_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!invite.used && !isExpired && (
                        <Button variant="outline" size="sm">
                          Copy Link
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
