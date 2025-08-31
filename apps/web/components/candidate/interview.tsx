'use client'

import { useEffect, useRef } from 'react'
import { toast } from '@/components/ui/use-toast'
import Script from 'next/script'

declare global {
  interface Window {
    QscreenInterview: {
      mount: (options: {
        el: string | HTMLElement;
        inviteToken: string;
        theme?: any;
        captions?: boolean;
        onEvent?: (event: { type: string; data?: any }) => void;
      }) => Promise<void>;
      unmount: (elementId: string) => void;
    };
  }
}

interface CandidateInterviewProps {
  session: any
}

export function CandidateInterview({ session }: CandidateInterviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate invite token from session data
  const inviteToken = session.invite_token || session.token || 'demo-token'

  const handleInterviewEvent = (event: { type: string; data?: any }) => {
    switch (event.type) {
      case 'start':
        toast({
          title: 'Interview started',
          description: 'You can now begin answering questions',
        })
        break
      case 'error':
        toast({
          title: 'Interview error',
          description: event.data?.message || 'An error occurred during the interview',
          variant: 'destructive',
        })
        break
      case 'submitted':
        toast({
          title: 'Interview completed',
          description: 'Thank you for completing the interview',
        })
        // Redirect after submission
        setTimeout(() => {
          window.location.href = '/candidate/dashboard'
        }, 2000)
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {session.interviews?.title || session.jobs?.title || 'Interview'}
          </h1>
          <p className="text-gray-600">
            {session.interviews?.description || session.jobs?.description || 'Complete your interview below'}
          </p>
        </div>

        {/* Embed Widget Container */}
        <div ref={containerRef} id="interview-widget-container" className="w-full min-h-[600px] border border-gray-200 rounded-lg bg-white">
          {/* Widget will be mounted here by the script */}
        </div>
        
        <Script 
          src="/embed.js" 
          onLoad={() => {
            if (containerRef.current && window.QscreenInterview) {
              window.QscreenInterview.mount({
                el: 'interview-widget-container',
                inviteToken,
                captions: true,
                onEvent: handleInterviewEvent
              }).catch(console.error);
            }
          }}
        />
      </div>
    </div>
  )
}
