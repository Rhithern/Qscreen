'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CandidateInterview } from '@/components/candidate/interview'
import { CandidateHistory } from '@/components/candidate/history'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface InterviewSession {
  id: string
  interview_id: string
  status: string
  interviews: {
    title: string
    description: string
  }
}

export default function CandidatePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [user, setUser] = useState<any>(null)
  const [interviewStatus, setInterviewStatus] = useState<'ready' | 'connected' | 'listening' | 'speaking'>('ready')

  useEffect(() => {
    const initializeClient = async () => {
      const supabase = await createClient()
    
      // Get current user
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null)
      })

      // If token is present, handle invitation
      if (token && !session) {
        handleInvitationToken(token)
      }
    }
    
    initializeClient()
  }, [token])

  const handleInvitationToken = async (invitationToken: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: invitationToken }),
      })

      if (!response.ok) {
        throw new Error('Failed to accept invitation')
      }

      const data = await response.json()
      setSession(data.session)
      
      // Remove token from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
      
    } catch (error) {
      toast({
        title: "Invalid invitation",
        description: "The invitation link is invalid or has expired",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startInterview = async () => {
    if (!session) return

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setInterviewStatus('connected')
      
      toast({
        title: "Interview started",
        description: "You're now connected to the interview",
      })
    } catch (error) {
      toast({
        title: "Microphone access required",
        description: "Please allow microphone access to start the interview",
        variant: "destructive",
      })
    }
  }

  // No session and no token - show friendly message
  if (!session && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Interview Access</CardTitle>
            <CardDescription>
              Your interview link is missing or expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              To join an interview, you need a valid invitation link from your interviewer.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Setting up your interview...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Interview session ready
  if (session) {
    return <CandidateInterview session={session} />
  }

  return null
}
