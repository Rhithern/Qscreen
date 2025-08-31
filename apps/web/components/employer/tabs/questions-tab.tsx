'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, GripVertical, Trash2, Edit } from 'lucide-react'
import { addQuestion, deleteQuestion, reorderQuestions } from '@/app/(dash)/actions/questions'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface QuestionsTabProps {
  interviewId: string
}

export function QuestionsTab({ interviewId }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState({ prompt: '', referenceAnswer: '' })
  const router = useRouter()

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.prompt.trim()) return

    setLoading(true)
    try {
      await addQuestion(interviewId, newQuestion.prompt, newQuestion.referenceAnswer)
      toast({
        title: 'Question added',
        description: 'New question has been added to the interview.',
      })
      setNewQuestion({ prompt: '', referenceAnswer: '' })
      setShowAddForm(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add question.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      await deleteQuestion(questionId)
      toast({
        title: 'Question deleted',
        description: 'Question has been removed from the interview.',
      })
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete question.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Interview Questions</CardTitle>
              <CardDescription>
                Add and manage questions for this interview
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Question Form */}
          {showAddForm && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Question Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={newQuestion.prompt}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Enter the interview question..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reference">Reference Answer (Optional)</Label>
                    <Textarea
                      id="reference"
                      value={newQuestion.referenceAnswer}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, referenceAnswer: e.target.value }))}
                      placeholder="Ideal answer or key points to look for..."
                      rows={3}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button type="submit" disabled={loading || !newQuestion.prompt.trim()}>
                      {loading ? 'Adding...' : 'Add Question'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false)
                        setNewQuestion({ prompt: '', referenceAnswer: '' })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="mb-2">No questions added yet</p>
                <p className="text-sm">Add your first question to get started</p>
              </div>
            ) : (
              questions.map((question, index) => (
                <Card key={question.id} className="relative">
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              Question {index + 1}
                            </Badge>
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              {question.prompt}
                            </p>
                            {question.reference_answer && (
                              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <strong>Reference:</strong> {question.reference_answer}
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-1 ml-4">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
