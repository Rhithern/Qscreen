'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wifi, WifiOff } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
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

interface InterviewRoomProps {
  session: {
    id: string
    status: string
    current_index: number
    jobs: {
      title: string
      brand?: any
      tenants: {
        name: string
        logo_url?: string
        theme?: any
      }
    }
    job_questions: Array<{
      id: string
      text: string
      time_limit_sec: number
      position: number
    }>
  }
}

export function InterviewRoom({ session }: InterviewRoomProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(session.current_index || 0)
  const [isRecording, setIsRecording] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isConnected, setIsConnected] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  
  const timerRef = useRef<NodeJS.Timeout>()
  const supabase = createClient()

  const currentQuestion = session.job_questions[currentQuestionIndex]
  const totalQuestions = session.job_questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  useEffect(() => {
    if (currentQuestion) {
      setTimeRemaining(currentQuestion.time_limit_sec)
    }
  }, [currentQuestion])

  useEffect(() => {
    // Check network status
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && isRecording) {
      handleStopRecording()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isRecording, timeRemaining])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        await uploadAudioChunk(audioBlob)
        setAudioChunks([])
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      
      // Start speech recognition for live captions
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript)
          }
        }
        recognition.start()
      }
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to continue with the interview",
        variant: "destructive",
      })
    }
  }

  function handleStopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
  }

  async function uploadAudioChunk(audioBlob: Blob) {
    try {
      // Upload to Supabase Storage (implement storage bucket)
      const fileName = `${session.id}_${currentQuestion.id}_${Date.now()}.webm`
      
      // For now, just log the audio blob size
      console.log('Audio chunk recorded:', audioBlob.size, 'bytes')
      
      // Save response to database
      await supabase.from('responses').insert({
        session_id: session.id,
        question_id: currentQuestion.id,
        transcript: transcript,
        duration_sec: currentQuestion.time_limit_sec - timeRemaining,
        audio_url: fileName // This would be the actual storage URL
      })
      
    } catch (error) {
      console.error('Failed to upload audio:', error)
      toast({
        title: "Upload failed",
        description: "Failed to save your response. Please try again.",
        variant: "destructive",
      })
    }
  }

  async function handleNextQuestion() {
    if (isRecording) {
      handleStopRecording()
    }

    const nextIndex = currentQuestionIndex + 1
    
    // Update session progress
    await supabase
      .from('sessions')
      .update({ 
        current_index: nextIndex,
        status: nextIndex >= totalQuestions ? 'submitted' : 'in_progress'
      })
      .eq('id', session.id)

    if (nextIndex >= totalQuestions) {
      // Interview completed
      toast({
        title: "Interview completed!",
        description: "Thank you for your time. Your responses have been submitted.",
      })
      window.location.href = '/candidate/dashboard'
    } else {
      setCurrentQuestionIndex(nextIndex)
      setTranscript('')
      setTimeRemaining(session.job_questions[nextIndex].time_limit_sec)
    }
  }

  async function handleSubmitInterview() {
    await supabase
      .from('sessions')
      .update({ status: 'submitted' })
      .eq('id', session.id)
    
    toast({
      title: "Interview submitted!",
      description: "Thank you for completing the interview.",
    })
    window.location.href = '/candidate/dashboard'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {session.jobs.tenants.logo_url && (
              <img 
                src={session.jobs.tenants.logo_url} 
                alt={session.jobs.tenants.name}
                className="h-8 w-auto"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold">{session.jobs.title}</h1>
              <p className="text-sm text-gray-400">{session.jobs.tenants.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            <Badge variant="secondary">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-gray-800 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content - Embed Widget */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl mx-auto w-full">
          <div 
            ref={containerRef} 
            id="interview-room-widget" 
            className="w-full min-h-[500px] bg-transparent"
          >
            {/* Widget will be mounted here */}
          </div>
        </div>
      </div>
      
      <Script 
        src="/embed.js" 
        onLoad={() => {
          if (containerRef.current && window.QscreenInterview) {
            window.QscreenInterview.mount({
              el: 'interview-room-widget',
              inviteToken: session.invite_token || session.token || 'demo-token',
              captions: true,
              onEvent: (event) => {
                switch (event.type) {
                  case 'submitted':
                    handleSubmitInterview()
                    break
                  case 'error':
                    toast({
                      title: "Interview error",
                      description: event.data?.message || 'An error occurred',
                      variant: "destructive",
                    })
                    break
                }
              }
            }).catch(console.error);
          }
        }}
      />

    </div>
  )
}
