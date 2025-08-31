'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssignedInterviews } from './assigned-interviews'
import { EvaluationForm } from './evaluation-form'
import { ReviewHistory } from './review-history'
import { Users, FileText, Clock, CheckCircle } from 'lucide-react'

interface HRDashboardProps {
  tenant: any
  assignments: any[]
}

export function HRDashboard({ tenant, assignments }: HRDashboardProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  // Calculate stats
  const totalAssignments = assignments.length
  const pendingReviews = assignments.filter(a => 
    a.interviews?.sessions?.some((s: any) => s.status === 'completed' && !s.evaluations?.length)
  ).length
  const completedReviews = assignments.filter(a =>
    a.interviews?.sessions?.some((s: any) => s.evaluations?.length > 0)
  ).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
              <p className="text-gray-600">{tenant?.name}</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline">Export Reviews</Button>
              <Button variant="outline">Settings</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{completedReviews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Score</p>
                  <p className="text-2xl font-bold text-gray-900">7.2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">Assigned Interviews</TabsTrigger>
            <TabsTrigger value="evaluate">Evaluate Responses</TabsTrigger>
            <TabsTrigger value="history">Review History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assignments">
            <AssignedInterviews 
              assignments={assignments} 
              onSelectSession={setSelectedSession}
            />
          </TabsContent>
          
          <TabsContent value="evaluate">
            <EvaluationForm sessionId={selectedSession} />
          </TabsContent>
          
          <TabsContent value="history">
            <ReviewHistory assignments={assignments} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
