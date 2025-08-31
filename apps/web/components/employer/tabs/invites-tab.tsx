'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Mail, Plus, ExternalLink } from 'lucide-react'
import { inviteCandidate } from '@/app/(dash)/actions/invitations'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface InvitesTabProps {
  interviewId: string
}

export function InvitesTab({ interviewId }: InvitesTabProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const router = useRouter()

  const handleInviteCandidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    try {
      const result = await inviteCandidate(interviewId, email.trim())
      toast({
        title: 'Invitation created',
        description: `Invitation link generated for ${email}`,
      })
      
      // Copy invite URL to clipboard
      await navigator.clipboard.writeText(result.inviteUrl)
      toast({
        title: 'Link copied',
        description: 'Invitation link has been copied to clipboard',
      })
      
      setEmail('')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invitation.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async (token: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/candidate?token=${token}`
    
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast({
        title: 'Link copied',
        description: 'Invitation link copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Invite Candidates</CardTitle>
          <CardDescription>
            Generate invitation links for candidates to join this interview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInviteCandidate} className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="email" className="sr-only">Candidate Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@company.com"
                required
              />
            </div>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Creating...' : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Link
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitation History</CardTitle>
          <CardDescription>
            Track sent invitations and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-2">No invitations sent yet</p>
              <p className="text-sm">Generate your first invitation link above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{invitation.candidate_email}</span>
                      <Badge variant={invitation.used ? 'default' : 'secondary'}>
                        {invitation.used ? 'Used' : 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Created {new Date(invitation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteLink(invitation.token)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        window.open(`${baseUrl}/candidate?token=${invitation.token}`, '_blank')
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
