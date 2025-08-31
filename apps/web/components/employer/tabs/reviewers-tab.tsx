'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, UserPlus, Trash2 } from 'lucide-react'
import { assignHR } from '@/app/(dash)/actions/invitations'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface ReviewersTabProps {
  interviewId: string
}

export function ReviewersTab({ interviewId }: ReviewersTabProps) {
  const [hrEmail, setHrEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [reviewers, setReviewers] = useState<any[]>([])
  const router = useRouter()

  const handleAssignHR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hrEmail.trim()) return

    setLoading(true)
    try {
      await assignHR(interviewId, hrEmail.trim())
      toast({
        title: 'HR reviewer assigned',
        description: `${hrEmail} has been assigned to review this interview`,
      })
      setHrEmail('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign HR reviewer. Make sure they exist in your organization.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Assign HR Reviewers</CardTitle>
          <CardDescription>
            Add HR team members who can evaluate candidate responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssignHR} className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="hrEmail" className="sr-only">HR Email</Label>
              <Input
                id="hrEmail"
                type="email"
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
                placeholder="hr@company.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !hrEmail.trim()}>
              {loading ? 'Assigning...' : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Reviewer
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Reviewers</CardTitle>
          <CardDescription>
            HR team members assigned to evaluate this interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No reviewers assigned yet</p>
              <p className="text-sm">Assign HR team members to help evaluate candidates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviewers.map((reviewer) => (
                <div key={reviewer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {reviewer.profiles?.full_name?.charAt(0) || reviewer.profiles?.email?.charAt(0) || 'H'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{reviewer.profiles?.full_name || 'HR Reviewer'}</p>
                      <p className="text-sm text-gray-600">{reviewer.profiles?.email}</p>
                    </div>
                    <Badge variant="secondary">HR</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
