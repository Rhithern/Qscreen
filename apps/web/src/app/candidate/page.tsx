'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Removed unused import

interface InterviewState {
  isConnected: boolean
  isRecording: boolean
  isSpeaking: boolean
  currentQuestion: string
  currentQuestionIndex: number
  totalQuestions: number
  transcript: string
  interimTranscript: string
  sessionId?: string
  error?: string
}

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export default function CandidatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  // Removed unused Supabase client
  
  const [state, setState] = useState<InterviewState>({
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    currentQuestion: '',
    currentQuestionIndex: 0,
    totalQuestions: 0,
    transcript: '',
    interimTranscript: ''
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  
  const { isConnected, isReconnecting, send } = useWebSocket({
    url: 'ws://localhost:8787/realtime',
    onMessage: (event: MessageEvent) => {
      const data = JSON.parse(event.data)
      handleServerMessage(data)
    },
    onOpen: () => {
      if (state.sessionId) {
        send({
          type: 'SESSION_META',
          sessionId: state.sessionId
        })
      }
    }
  })

  // Handle token validation and session creation
  useEffect(() => {
    const validateToken = async () => {
      if (!token) return

      try {
        const response = await fetch('/api/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        if (!response.ok) {
          const url = new URL(response.url)
          router.replace(url.pathname + url.search)
          return
        }

        const data = await response.json()
        setState(prev => ({ ...prev, sessionId: data.session.id }))
        
        // Remove token from URL after successful validation
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('token')
        window.history.replaceState({}, '', newUrl)

      } catch (error) {
        console.error('Error validating token:', error)
        router.replace('/candidate/welcome?error=server_error')
      }
    }

    validateToken()
  }, [token, router])

  // Update state based on WebSocket connection
  useEffect(() => {
    setState(prev => ({ ...prev, isConnected }))
  }, [isConnected])

  const handleServerMessage = (data: any) => {
    switch (data.type) {
      case 'RESPONSE_INTERIM':
        setState(prev => ({ ...prev, interimTranscript: data.text }))
        break
      case 'RESPONSE_FINAL':
        setState(prev => ({ 
          ...prev, 
          transcript: data.text,
          interimTranscript: ''
        }))
        break
      case 'INTERVIEWER_STATE':
        setState(prev => ({ ...prev, isSpeaking: data.value === 'speaking' }))
        break
      case 'AUDIO_CHUNK':
        handleAudioChunk(data.data)
        break
      case 'QUESTION_UPDATE':
        setState(prev => ({ 
          ...prev, 
          currentQuestion: data.prompt,
          currentQuestionIndex: data.index
        }))
        break
      case 'COMPLETE':
        setState(prev => ({ 
          ...prev, 
          isRecording: false,
          currentQuestion: 'Interview completed! Thank you for your time.',
          isSpeaking: false
        }))
        break
      case 'ERROR':
        setState(prev => ({ 
          ...prev, 
          error: data.message 
        }))
        break
    }
  }

  const handleAudioChunk = (audioData: ArrayBuffer) => {
    audioQueueRef.current.push(audioData)
    if (!isPlayingRef.current) {
      playNextAudioChunk()
    }
  }

  const playNextAudioChunk = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      return
    }

    isPlayingRef.current = true
    const audioData = audioQueueRef.current.shift()!

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData)
      const source = audioContextRef.current.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContextRef.current.destination)
      
      source.onended = () => {
        playNextAudioChunk()
      }
      
      source.start()
    } catch (error) {
      console.error('Error playing audio:', error)
      playNextAudioChunk()
    }
  }

  const startInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isConnected) {
          // Convert to PCM 16kHz mono
          convertToPCM(event.data).then(pcmData => {
            send({
              type: 'AUDIO_CHUNK',
              data: pcmData
            })
          })
        }
      }

      mediaRecorder.start(100) // Send chunks every 100ms
      setState(prev => ({ ...prev, isRecording: true }))

      // Send start command
      send({ type: 'START' })

    } catch (error) {
      console.error('Error starting interview:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Unable to access microphone. Please check your browser permissions and try again.' 
      }))
    }
  }

  const stopInterview = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    
    send({ type: 'STOP' })
    setState(prev => ({ ...prev, isRecording: false }))
  }

  const handleBargeIn = () => {
    send({ type: 'BARGE_IN' })
  }

  const convertToPCM = async (audioBlob: Blob): Promise<ArrayBuffer> => {
    // This is a simplified conversion - in production you'd use AudioWorklet
    const arrayBuffer = await audioBlob.arrayBuffer()
    return arrayBuffer
  }

  // Show error card if no session or error
  if (!state.sessionId && !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-16">
          <Card>
            <CardHeader>
              <CardTitle>Interview Link Not Found</CardTitle>
              <CardDescription>
                Your interview link is missing or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please check your email for the correct link or contact the employer for assistance.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.href = 'mailto:support@example.com'}
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show error message if there's an error
  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto pt-16">
          <Card>
            <CardHeader>
              <CardTitle>Connection Error</CardTitle>
              <CardDescription>
                We're having trouble connecting to the interview server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {state.error}
              </p>
              <Button
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <AuthenticatedLayout allowedRoles={['candidate']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Interview Session
          </h1>
          <div className="flex items-center gap-2 justify-center">
            <div className={`w-2 h-2 rounded-full ${
              !state.isConnected ? 'bg-yellow-500 animate-pulse' :
              state.isSpeaking ? 'bg-green-500 animate-pulse' :
              state.isRecording ? 'bg-blue-500 animate-pulse' :
              'bg-gray-300'
            }`} />
            <p className="text-gray-600 dark:text-gray-300">
              {!state.isConnected ? 'Connecting...' :
               state.isSpeaking ? 'Listening to question' :
               state.isRecording ? 'Interview in progress' :
               'Ready to begin'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Interview Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Controls</CardTitle>
              <CardDescription>
                {state.isRecording ? 
                  'Your interview is in progress' : 
                  'Ready to start when you are'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {!state.isRecording ? (
                  <Button 
                    onClick={startInterview}
                    disabled={!state.isConnected}
                    className="flex-1"
                  >
                    Start Interview
                  </Button>
                ) : (
                  <Button 
                    onClick={stopInterview}
                    variant="destructive"
                    className="flex-1"
                  >
                    End Interview
                  </Button>
                )}
                
                {state.isSpeaking && (
                  <Button 
                    onClick={handleBargeIn}
                    variant="outline"
                  >
                    Next Question
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Question</span>
                  <span>{state.currentQuestionIndex + 1} of {state.totalQuestions || '-'}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((state.currentQuestionIndex + 1) / (state.totalQuestions || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {state.isConnected ? 'Connected' : 'Waiting to connect'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${state.isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                  {state.isRecording ? 'Speaking' : 'Microphone ready'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${state.isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                  {state.isSpeaking ? 'Listening' : 'Ready'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Question */}
          <Card>
            <CardHeader>
              <CardTitle>Current Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[100px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {state.currentQuestion || 'Your first question will appear here...'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Area */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Response</CardTitle>
              <CardDescription>
                Live transcription of your answer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-gray-600 dark:text-gray-400 mb-2">
                  {state.interimTranscript && (
                    <span className="text-blue-600">{state.interimTranscript}</span>
                  )}
                </div>
                <div className="text-gray-900 dark:text-white">
                  {state.transcript}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Connection Status</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {state.isConnected ? 'Connected' : 'Connecting to interview server...'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Session Status</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {state.isRecording ? 'Interview in progress' : 'Ready to begin'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Audio Status</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {state.isRecording ? 'Microphone active' : 'Microphone ready'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </AuthenticatedLayout>
  )
}

