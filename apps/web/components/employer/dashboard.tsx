'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Users, FileText, BarChart3, Settings } from 'lucide-react'
import { InterviewList } from './interview-list'
import { CreateInterviewDialog } from './create-interview-dialog'
import { InterviewDetails } from './interview-details'

interface EmployerDashboardProps {
  tenant: any
  interviews: any[]
}

export function EmployerDashboard({ tenant, interviews }: EmployerDashboardProps) {
  const [selectedInterview, setSelectedInterview] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const selectedInterviewData = interviews.find(i => i.id === selectedInterview)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tenant?.name || 'Interview Platform'}</h1>
              <p className="text-gray-600">Manage interviews and candidates</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Interview
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Interview List */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Interviews
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <InterviewList
                  interviews={interviews}
                  selectedId={selectedInterview}
                  onSelect={setSelectedInterview}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-8">
            {selectedInterviewData ? (
              <InterviewDetails interview={selectedInterviewData} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select an Interview</CardTitle>
                  <CardDescription>
                    Choose an interview from the list to manage questions, invitations, and view results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {interviews.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews yet</h3>
                      <p className="text-gray-600 mb-4">
                        Create your first interview to get started with candidate evaluations
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Interview
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-600">Select an interview from the left panel to view details and manage it.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <CreateInterviewDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
