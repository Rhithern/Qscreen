'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function WebSocketDebugPage() {
  const [messages, setMessages] = useState<string[]>([])
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8787/realtime'

  const { isConnected, isReconnecting, send } = useWebSocket({
    url: wsUrl,
    onMessage: (event) => {
      setMessages(prev => [...prev, `Received: ${event.data}`])
    },
    onOpen: () => {
      setMessages(prev => [...prev, '✓ Connected to WebSocket server'])
    },
    onClose: () => {
      setMessages(prev => [...prev, '× WebSocket connection closed'])
    },
    onError: (error) => {
      setMessages(prev => [...prev, `Error: ${error}`])
    }
  })

  const sendTestMessage = () => {
    send({ type: 'PING', timestamp: new Date().toISOString() })
    setMessages(prev => [...prev, 'Sent: PING'])
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">WebSocket Debug</h1>

      <Card>
        <CardHeader>
          <CardTitle>WebSocket Status</CardTitle>
          <CardDescription>Current connection status and configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 
                isReconnecting ? 'bg-yellow-500 animate-pulse' : 
                'bg-red-500'
              }`} />
              <span>{
                isConnected ? 'Connected' :
                isReconnecting ? 'Reconnecting...' :
                'Disconnected'
              }</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>WebSocket URL: {wsUrl}</p>
            </div>
            <Button onClick={sendTestMessage} disabled={!isConnected}>
              Send Test Message
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Log</CardTitle>
          <CardDescription>WebSocket communication history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] overflow-y-auto space-y-2 font-mono text-sm">
            {messages.map((msg, i) => (
              <div key={i} className="p-2 bg-muted rounded">
                {msg}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
