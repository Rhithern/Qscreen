'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Eye, Download, Filter } from 'lucide-react'
import { useState } from 'react'

interface ReviewHistoryProps {
  assignments: any[]
}

export function ReviewHistory({ assignments }: ReviewHistoryProps) {
  const [filters, setFilters] = useState({
    search: '',
    interview: 'all',
    scoreRange: 'all'
  })

  // Flatten all evaluations from assignments
  const allEvaluations = assignments.flatMap(assignment =>
    assignment.interviews?.sessions?.flatMap((session: any) =>
      session.responses?.flatMap((response: any) =>
        response.evaluations?.map((evaluation: any) => ({
          ...evaluation,
          candidateName: session.candidate?.full_name || 'Anonymous',
          candidateEmail: session.candidate?.email,
          interviewTitle: assignment.interviews.title,
          questionPrompt: response.question?.prompt,
          sessionId: session.id,
          responseId: response.id
        })) || []
      ) || []
    ) || []
  )

  const filteredEvaluations = allEvaluations.filter(evaluation => {
    const matchesSearch = !filters.search || 
      evaluation.candidateName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      evaluation.candidateEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
      evaluation.interviewTitle?.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesInterview = filters.interview === 'all' || 
      evaluation.interviewTitle === filters.interview
    
    const matchesScore = filters.scoreRange === 'all' ||
      (filters.scoreRange === 'high' && evaluation.score >= 8) ||
      (filters.scoreRange === 'medium' && evaluation.score >= 6 && evaluation.score < 8) ||
      (filters.scoreRange === 'low' && evaluation.score < 6)
    
    return matchesSearch && matchesInterview && matchesScore
  })

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const uniqueInterviews = [...new Set(allEvaluations.map(e => e.interviewTitle))]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Review History</CardTitle>
              <CardDescription>
                View all your completed evaluations and feedback
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search candidates or interviews..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select 
              value={filters.interview} 
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, interview: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Interviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interviews</SelectItem>
                {uniqueInterviews.map(interview => (
                  <SelectItem key={interview} value={interview}>
                    {interview}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={filters.scoreRange} 
              onValueChange={(value: string) => setFilters(prev => ({ ...prev, scoreRange: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">8-10 High</SelectItem>
                <SelectItem value="medium">6-7 Medium</SelectItem>
                <SelectItem value="low">1-5 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {filteredEvaluations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No evaluations found</p>
              <p className="text-sm">
                {allEvaluations.length === 0 
                  ? 'Complete your first evaluation to see history here'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Interview</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvaluations.map((evaluation, index) => (
                    <TableRow key={`${evaluation.responseId}-${index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{evaluation.candidateName}</p>
                          <p className="text-sm text-gray-600">{evaluation.candidateEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{evaluation.interviewTitle}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm max-w-xs truncate" title={evaluation.questionPrompt}>
                          {evaluation.questionPrompt}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getScoreColor(evaluation.score)}>
                          {evaluation.score}/10
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
