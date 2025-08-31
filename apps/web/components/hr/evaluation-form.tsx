'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { recordEvaluation, postComment } from '@/app/(dash)/actions/evaluations'
import { toast } from '@/components/ui/use-toast'
import { Play, Pause, Volume2 } from 'lucide-react'

interface EvaluationFormProps {
  sessionId: string | null
}

export function EvaluationForm({ sessionId }: EvaluationFormProps) {
  const [session, setSession] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<Record<string, { score: number; notes: string }>>({})
  const [loading, setLoading] = useState(false)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      // Fetch session details with responses
      fetchSessionDetails()
    }
  }, [sessionId])

  const fetchSessionDetails = async () => {
    // This would fetch from API in real implementation
    // For now, using placeholder data
  }

  const handleScoreChange = (responseId: string, score: number) => {
    setEvaluations(prev => ({
      ...prev,
      [responseId]: {
        ...prev[responseId],
        score
      }
    }))
  }

  const handleNotesChange = (responseId: string, notes: string) => {
    setEvaluations(prev => ({
      ...prev,
      [responseId]: {
        ...prev[responseId],
        notes
      }
    }))
  }

  const handleSubmitEvaluation = async (responseId: string) => {
    const evaluation = evaluations[responseId]
    if (!evaluation?.score) {
      toast({
        title: 'Score required',
        description: 'Please provide a score before submitting.',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      await recordEvaluation(responseId, evaluation.score, evaluation.notes || '')
      toast({
        title: 'Evaluation saved',
        description: 'Your evaluation has been recorded.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save evaluation.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioUrl)
    }
  }

  if (!sessionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Session</CardTitle>
          <CardDescription>
            Choose a session from the Assigned Interviews tab to begin evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="mb-2">No session selected</p>
            <p className="text-sm">Select a completed interview session to evaluate responses</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Session</CardTitle>
          <CardDescription>
            Review candidate responses and provide scores and feedback
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Mock responses for demonstration */}
      {[1, 2, 3].map((questionNum) => (
        <Card key={questionNum}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Question {questionNum}</CardTitle>
                <CardDescription className="mt-2">
                  Tell me about a challenging project you worked on and how you overcame the obstacles.
                </CardDescription>
              </div>
              <Badge variant="outline">Response {questionNum}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Player */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Audio Response</Label>
                <span className="text-xs text-gray-600">2:34 duration</span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAudio(`response-${questionNum}`)}
                >
                  {playingAudio === `response-${questionNum}` ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-1/3" />
                </div>
                <Volume2 className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Transcript */}
            <div>
              <Label className="text-sm font-medium">Transcript</Label>
              <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                <p>
                  "I worked on a project where we had to integrate multiple legacy systems with a new platform. 
                  The main challenge was that the documentation was outdated and some of the original developers 
                  had left the company. I approached this by first mapping out all the existing integrations, 
                  then systematically testing each connection point..."
                </p>
              </div>
            </div>

            <Separator />

            {/* Evaluation Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Score (1-10)</Label>
                <div className="mt-2 px-3">
                  <Slider
                    value={[evaluations[`response-${questionNum}`]?.score || 5]}
                    onValueChange={([value]) => handleScoreChange(`response-${questionNum}`, value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>1 - Poor</span>
                    <span className="font-medium">
                      {evaluations[`response-${questionNum}`]?.score || 5}
                    </span>
                    <span>10 - Excellent</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor={`notes-${questionNum}`} className="text-sm font-medium">
                  Evaluation Notes
                </Label>
                <Textarea
                  id={`notes-${questionNum}`}
                  value={evaluations[`response-${questionNum}`]?.notes || ''}
                  onChange={(e) => handleNotesChange(`response-${questionNum}`, e.target.value)}
                  placeholder="Provide detailed feedback on the candidate's response..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSubmitEvaluation(`response-${questionNum}`)}
                  disabled={loading || !evaluations[`response-${questionNum}`]?.score}
                >
                  {loading ? 'Saving...' : 'Save Evaluation'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
