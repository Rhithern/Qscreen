'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CandidateResponse {
  id: string
  candidate_name: string
  interview_title: string
  score: number
  status: 'completed' | 'in_progress'
  completed_at: string
  transcript: string
  feedback: string
}

export default function HRPage() {
  const [responses, setResponses] = useState<CandidateResponse[]>([
    {
      id: '1',
      candidate_name: 'John Doe',
      interview_title: 'Software Engineer - Frontend',
      score: 8.5,
      status: 'completed',
      completed_at: '2024-01-15T10:30:00Z',
      transcript: 'I have 5 years of experience in React and TypeScript...',
      feedback: 'Strong technical knowledge demonstrated. Good communication skills.'
    },
    {
      id: '2',
      candidate_name: 'Jane Smith',
      interview_title: 'Software Engineer - Frontend',
      score: 6.2,
      status: 'completed',
      completed_at: '2024-01-14T14:20:00Z',
      transcript: 'I worked with React for about 2 years...',
      feedback: 'Basic understanding shown. Needs improvement in advanced concepts.'
    },
    {
      id: '3',
      candidate_name: 'Mike Johnson',
      interview_title: 'Product Manager',
      score: 0,
      status: 'in_progress',
      completed_at: '',
      transcript: '',
      feedback: ''
    }
  ])

  const [selectedResponse, setSelectedResponse] = useState<CandidateResponse | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            HR Review Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review candidate responses and interview results
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Assigned Interviews
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {new Set(responses.map(r => r.interview_title)).size}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Candidates
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {responses.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Completed
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {responses.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Avg Score
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {responses.filter(r => r.status === 'completed').length > 0 ? 
                      (responses.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.score, 0) / responses.filter(r => r.status === 'completed').length).toFixed(1) : 
                      '0.0'
                    }
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Responses */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Candidate Responses</CardTitle>
                <CardDescription>
                  Review interview results and transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div 
                      key={response.id} 
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedResponse?.id === response.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedResponse(response)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {response.candidate_name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              response.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {response.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {response.interview_title}
                          </p>
                          {response.status === 'completed' && (
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">
                                Score: <span className="font-semibold">{response.score}/10</span>
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(response.completed_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Details */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Response Details</CardTitle>
                <CardDescription>
                  {selectedResponse ? 'Review candidate response' : 'Select a response to view details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedResponse ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedResponse.candidate_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedResponse.interview_title}
                      </p>
                    </div>

                    {selectedResponse.status === 'completed' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Overall Score
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(selectedResponse.score / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">
                              {selectedResponse.score}/10
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Transcript
                          </label>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                            {selectedResponse.transcript}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Interview Feedback
                          </label>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                            {selectedResponse.feedback}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Download Audio
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Export Report
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Interview in progress
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a candidate response to view details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

