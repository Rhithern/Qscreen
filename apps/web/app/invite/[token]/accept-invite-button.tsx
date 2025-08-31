'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AcceptInviteButtonProps {
  token: string
}

export function AcceptInviteButton({ token }: AcceptInviteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAcceptInvite() {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Create anonymous user for passwordless flow
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
        if (authError) throw authError
      }

      // Call the accept invite function
      const { data, error } = await supabase.rpc('accept_invite', { invite_token: token })
      
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      
      toast({
        title: "Welcome!",
        description: "You've successfully joined the interview. Redirecting to your dashboard...",
      })
      
      // Redirect to candidate dashboard
      router.push('/candidate/dashboard')
    } catch (error) {
      toast({
        title: "Failed to accept invite",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleAcceptInvite} 
      disabled={loading}
      size="lg"
      className="w-full"
    >
      {loading ? 'Accepting...' : 'Continue to Dashboard'}
    </Button>
  )
}
