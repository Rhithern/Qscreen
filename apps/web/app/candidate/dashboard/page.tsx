import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Play } from 'lucide-react'
import Link from 'next/link'

async function getCandidateData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get candidate's session
  const { data: session } = await supabase
    .from('sessions')
    .select(`
      id,
      status,
      current_index,
      started_at,
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
      ),
      job_questions(count)
    `)
    .eq('candidate_id', user.id)
    .single()

  if (!session) {
    redirect('/auth/login')
  }

  return { user, session }
}

export default async function CandidateDashboardPage() {
  const { user, session } = await getCandidateData()
  const job = session.jobs
  const tenant = job.tenants
  const questionCount = session.job_questions?.[0]?.count || 0

  const canStart = session.status === 'not_started'
  const canResume = session.status === 'in_progress'
  const isCompleted = session.status === 'submitted'

  const timeRemaining = job.due_date 
    ? Math.ceil((new Date(job.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

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
            Welcome back!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Ready to continue your interview with {tenant.name}?
          </p>
        </div>

        {/* Status Card */}
        {isCompleted ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interview Completed!</h3>
              <p className="text-muted-foreground mb-4">
                Thank you for completing your interview. The hiring team will review your responses and get back to you soon.
              </p>
              <Badge variant="default">Submitted</Badge>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {tenant.name}
                  </CardDescription>
                </div>
                <Badge variant={canStart ? 'secondary' : canResume ? 'default' : 'outline'}>
                  {canStart ? 'Ready to start' : canResume ? 'In progress' : 'Not started'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {job.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                )}
                
                {timeRemaining !== null && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {timeRemaining > 0 ? `${timeRemaining} days left` : 'Due today'}
                  </div>
                )}

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  ~{Math.ceil(questionCount * 3)} minutes
                </div>
              </div>

              {job.jd && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">About this role</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {job.jd.length > 200 ? `${job.jd.substring(0, 200)}...` : job.jd}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      {canStart ? 'Ready to begin' : 
                       canResume ? `Question ${session.current_index + 1} of ${questionCount}` :
                       'Not started'}
                    </p>
                  </div>
                  {canResume && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {Math.round(((session.current_index || 0) / questionCount) * 100)}%
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${((session.current_index || 0) / questionCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Link href={`/interview/${session.id}`}>
                  <Button size="lg" className="w-full">
                    <Play className="h-5 w-5 mr-2" />
                    {canStart ? 'Start Interview' : canResume ? 'Continue Interview' : 'View Interview'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Before you begin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium">Find a quiet space</div>
                    <div className="text-muted-foreground">Ensure you have a stable internet connection and minimal background noise</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium">Test your microphone</div>
                    <div className="text-muted-foreground">Make sure your microphone is working and you can speak clearly</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium">Take your time</div>
                    <div className="text-muted-foreground">Think through your answers - you can pause between questions</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
