import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { AcceptInviteButton } from './accept-invite-button'

async function getInviteData(token: string) {
  const supabase = await createClient()
  
  // Get invite details
  const { data: invite } = await supabase
    .from('invites')
    .select(`
      id,
      email,
      name,
      used,
      expires_at,
      jobs!inner(
        id,
        title,
        location,
        jd,
        due_date,
        brand,
        tenants!inner(
          name,
          logo_url
        )
      )
    `)
    .eq('token', token)
    .single()

  if (!invite) {
    return { error: 'Invalid invite link' }
  }

  if (invite.used) {
    return { error: 'This invite has already been used' }
  }

  if (new Date(invite.expires_at) <= new Date()) {
    return { error: 'This invite has expired' }
  }

  return { invite }
}

export default async function InviteAcceptPage({
  params,
}: {
  params: { token: string }
}) {
  const { invite, error } = await getInviteData(params.token)

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Invalid Invite</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Link href="/auth/login">
              <Button variant="outline">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const job = invite.jobs
  const tenant = job.tenants
  const timeRemaining = Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          {tenant.logo_url && (
            <img 
              src={tenant.logo_url} 
              alt={tenant.name}
              className="h-12 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-900">
            You're Invited!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {tenant.name} has invited you to interview for a position
          </p>
        </div>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{job.title}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {tenant.name}
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {timeRemaining} day{timeRemaining !== 1 ? 's' : ''} left
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {job.location}
              </div>
            )}
            
            {job.due_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Complete by: {new Date(job.due_date).toLocaleDateString()}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Estimated time: 30-45 minutes
            </div>

            {job.jd && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">About this role</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {job.jd.length > 300 ? `${job.jd.substring(0, 300)}...` : job.jd}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Candidate Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Hello, {invite.name || invite.email}!
              </h3>
              <p className="text-muted-foreground mb-6">
                Ready to showcase your skills? This interview will help us understand your experience and fit for the role.
              </p>
              
              <AcceptInviteButton token={params.token} />
              
              <p className="text-xs text-muted-foreground mt-4">
                By continuing, you'll create an account and can return anytime before the deadline.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* What to Expect */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What to expect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <div>
                  <div className="font-medium">Audio-based questions</div>
                  <div className="text-muted-foreground">Answer questions by speaking - no video required</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <div>
                  <div className="font-medium">Take your time</div>
                  <div className="text-muted-foreground">Each question has a time limit, but you can pause between questions</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <div>
                  <div className="font-medium">Submit when ready</div>
                  <div className="text-muted-foreground">Review your responses and submit your interview</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
