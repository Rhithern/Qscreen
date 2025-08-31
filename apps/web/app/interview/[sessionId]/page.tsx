import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InterviewRoom } from './interview-room'

async function getInterviewData(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get session with questions
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
        brand,
        tenants!inner(
          name,
          logo_url,
          theme
        )
      ),
      job_questions(
        id,
        text,
        time_limit_sec,
        position
      )
    `)
    .eq('id', sessionId)
    .eq('candidate_id', user.id)
    .single()

  if (!session) {
    redirect('/candidate/dashboard')
  }

  if (session.status === 'submitted') {
    redirect('/candidate/dashboard')
  }

  // Sort questions by position
  const questions = (session.job_questions || []).sort((a, b) => a.position - b.position)

  return { session: { ...session, job_questions: questions } }
}

export default async function InterviewPage({
  params,
}: {
  params: { sessionId: string }
}) {
  const { session } = await getInterviewData(params.sessionId)

  return (
    <div className="min-h-screen bg-gray-900">
      <InterviewRoom session={session} />
    </div>
  )
}
