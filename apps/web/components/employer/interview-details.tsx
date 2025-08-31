'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuestionsTab } from './tabs/questions-tab'
import { InvitesTab } from './tabs/invites-tab'
import { ReviewersTab } from './tabs/reviewers-tab'
import { ResultsTab } from './tabs/results-tab'
import { updateInterviewStatus } from '@/app/(dash)/actions/interviews'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface InterviewDetailsProps {
  interview: any
}

export function InterviewDetails({ interview }: InterviewDetailsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (status: 'draft' | 'open' | 'closed') => {
    setLoading(true)
    try {
      await updateInterviewStatus(interview.id, status)
      toast({
        title: 'Status updated',
        description: `Interview is now ${status}.`,
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'open': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Interview Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{interview.title}</CardTitle>
              {interview.description && (
                <CardDescription className="mt-2">{interview.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor(interview.status)}>
                {interview.status}
              </Badge>
              <div className="flex space-x-2">
                {interview.status === 'draft' && (
                  <Button 
                    size="sm" 
                    onClick={() => handleStatusChange('open')}
                    disabled={loading}
                  >
                    Open Interview
                  </Button>
                )}
                {interview.status === 'open' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('closed')}
                    disabled={loading}
                  >
                    Close Interview
                  </Button>
                )}
                {interview.status === 'closed' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleStatusChange('open')}
                    disabled={loading}
                  >
                    Reopen Interview
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Questions:</span>
              <div className="font-medium">{interview.questions?.[0]?.count || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">Invitations:</span>
              <div className="font-medium">{interview.invitations?.[0]?.count || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">Sessions:</span>
              <div className="font-medium">{interview.sessions?.[0]?.count || 0}</div>
            </div>
            <div>
              <span className="text-gray-600">Created:</span>
              <div className="font-medium">{new Date(interview.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Management Tabs */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="invites">Invitations</TabsTrigger>
          <TabsTrigger value="reviewers">Reviewers</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="space-y-4">
          <QuestionsTab interviewId={interview.id} />
        </TabsContent>
        
        <TabsContent value="invites" className="space-y-4">
          <InvitesTab interviewId={interview.id} />
        </TabsContent>
        
        <TabsContent value="reviewers" className="space-y-4">
          <ReviewersTab interviewId={interview.id} />
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <ResultsTab interviewId={interview.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
