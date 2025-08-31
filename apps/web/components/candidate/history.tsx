'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Clock, CheckCircle, FileText } from 'lucide-react'

interface CandidateHistoryProps {
  sessions: any[]
}

export function CandidateHistory({ sessions }: CandidateHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <p className="mt-2 text-gray-600">
            View your completed and ongoing interviews
          </p>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Interviews Yet</CardTitle>
              <CardDescription>
                You haven't participated in any interviews yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">No interview history</p>
                <p className="text-sm">
                  When you receive interview invitations and complete them, they will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Interviews</p>
                      <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sessions.filter(s => s.status === 'completed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {sessions.filter(s => s.status === 'in_progress').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Interviews</CardTitle>
                <CardDescription>
                  Complete history of your interview sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Interview</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(session.status)}
                              <div>
                                <p className="font-medium">{session.interview?.title}</p>
                                <p className="text-sm text-gray-600">
                                  {session.interview?.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{session.interview?.tenant?.name}</p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(session.status)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {session.started_at 
                              ? new Date(session.started_at).toLocaleDateString()
                              : 'Not started'
                            }
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {session.completed_at && session.started_at
                              ? `${Math.round((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60))} min`
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {session.status === 'in_progress' && (
                                <Button size="sm">
                                  Continue
                                </Button>
                              )}
                              {session.status === 'completed' && (
                                <Button size="sm" variant="outline">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Results
                                </Button>
                              )}
                              {session.status === 'pending' && (
                                <Button size="sm" variant="outline" disabled>
                                  Waiting
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
