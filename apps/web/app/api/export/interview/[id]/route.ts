import { createClient } from '@/lib/supabase/server'
import { generateCSV } from '@/lib/csv'
import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Verify access to interview
  const { data: interview } = await supabase
    .from('interviews')
    .select('title, tenant_id')
    .eq('id', id)
    .single()

  if (!interview) {
    return new Response('Interview not found', { status: 404 })
  }

  // Get responses with evaluations
  const { data: responses } = await supabase
    .from('responses')
    .select(`
      id,
      transcript,
      model_score,
      created_at,
      question:questions(prompt),
      session:sessions(candidate:profiles(full_name, email)),
      evaluations(score, notes, reviewer:profiles(full_name))
    `)
    .eq('session.interview_id', id)

  if (!responses) {
    return new Response('No data found', { status: 404 })
  }

  // Transform data for CSV
  const csvData = responses.map((response: any) => ({
    candidate_name: response.session?.[0]?.candidate?.[0]?.full_name || 'Unknown',
    candidate_email: response.session?.[0]?.candidate?.[0]?.email || 'Unknown',
    question: response.question?.[0]?.prompt || 'Unknown',
    transcript: response.transcript || '',
    model_score: response.model_score || '',
    avg_hr_score: response.evaluations?.length 
      ? (response.evaluations.reduce((sum: any, e: any) => sum + e.score, 0) / response.evaluations.length).toFixed(1)
      : '',
    hr_evaluations: response.evaluations?.map((e: any) => 
      `${e.reviewer?.[0]?.full_name}: ${e.score}/10 - ${e.notes || 'No notes'}`
    ).join(' | ') || '',
    submitted_at: new Date(response.created_at).toLocaleString()
  }))

  return generateCSV(csvData, `interview-${id}-results.csv`)
}
