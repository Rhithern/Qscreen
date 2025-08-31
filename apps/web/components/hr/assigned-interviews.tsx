'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, MessageSquare, Clock, CheckCircle2 } from 'lucide-react'

interface AssignedInterviewsProps {
  assignments: any[]
  onSelectSession: (sessionId: string) => void
}

export function AssignedInterviews({ assignments, onSelectSession }: AssignedInterviewsProps) {
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

  const getEvaluationStatus = (session: any) => {
    const evaluations = session.responses?.flatMap((r: any) => r.evaluations || [])
    if (!evaluations?.length) return 'pending'
    return evaluations.length === session.responses?.length ? 'complete' : 'partial'
  }

  return (
    <div className="space-y-6">
      {assignments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Assignments</CardTitle>
            <CardDescription>
              You haven't been assigned to review any interviews yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No interview assignments</p>
              <p className="text-sm">Assignments will appear here when employers add you as a reviewer</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{assignment.interviews?.title}</CardTitle>
                  <CardDescription>
                    {assignment.interviews?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {assignment.interviews?.sessions?.length || 0} Sessions
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {assignment.interviews?.sessions?.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Evaluation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignment.interviews.sessions.map((session: any) => {
                        const evalStatus = getEvaluationStatus(session)
                        return (
                          <TableRow key={session.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {session.candidate?.full_name || 'Anonymous'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {session.candidate?.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(session.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="text-sm">
                                  {session.responses?.length || 0}/{assignment.interviews.questions?.length || 0}
                                </div>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ 
                                      width: `${((session.responses?.length || 0) / (assignment.interviews.questions?.length || 1)) * 100}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {evalStatus === 'complete' && (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-600">Complete</span>
                                  </>
                                )}
                                {evalStatus === 'partial' && (
                                  <>
                                    <Clock className="w-4 h-4 text-yellow-600" />
                                    <span className="text-sm text-yellow-600">Partial</span>
                                  </>
                                )}
                                {evalStatus === 'pending' && (
                                  <>
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">Pending</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSelectSession(session.id)}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Review
                                </Button>
                                {session.status === 'completed' && evalStatus !== 'complete' && (
                                  <Button
                                    size="sm"
                                    onClick={() => onSelectSession(session.id)}
                                  >
                                    Evaluate
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No sessions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
