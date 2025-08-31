'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Play, FileText, Filter } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface ResultsTabProps {
  interviewId: string
}

export function ResultsTab({ interviewId }: ResultsTabProps) {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    minScore: '',
    question: 'all'
  })

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/export/interview/${interviewId}`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `interview-${interviewId}-results.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: 'Export complete',
        description: 'Results have been downloaded as CSV',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to export results',
        variant: 'destructive',
      })
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interview Results</CardTitle>
              <CardDescription>
                View and analyze candidate responses and evaluations
              </CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search candidates..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <Select value={filters.minScore} onValueChange={(value) => setFilters(prev => ({ ...prev, minScore: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any Score</SelectItem>
                <SelectItem value="8">8+ Excellent</SelectItem>
                <SelectItem value="6">6+ Good</SelectItem>
                <SelectItem value="4">4+ Fair</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.question} onValueChange={(value) => setFilters(prev => ({ ...prev, question: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Questions</SelectItem>
                <SelectItem value="q1">Question 1</SelectItem>
                <SelectItem value="q2">Question 2</SelectItem>
                <SelectItem value="q3">Question 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Table */}
          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No results yet</p>
              <p className="text-sm">Results will appear here once candidates complete their interviews</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Avg Score</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.candidate?.full_name || 'Anonymous'}</p>
                          <p className="text-sm text-gray-600">{result.candidate?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            {result.completed_responses}/{result.total_questions}
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(result.completed_responses / result.total_questions) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.avg_score ? (
                          <Badge className={getScoreColor(result.avg_score)}>
                            {result.avg_score.toFixed(1)}/10
                          </Badge>
                        ) : (
                          <span className="text-gray-400">No scores</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(result.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View Details
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
