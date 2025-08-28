'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useToast } from './use-toast'

interface WebSocketHookOptions {
  url: string
  onMessage?: (event: MessageEvent) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsReconnecting(false)
        reconnectAttemptsRef.current = 0
        onOpen?.()
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        onClose?.()

        // Don't reconnect if the close was intentional
        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          setIsReconnecting(true)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, reconnectInterval)
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          toast({
            title: 'Connection Error',
            description: 'Unable to reconnect to the interview server. Please refresh the page to try again.',
            variant: 'destructive',
          })
        }
      }

      ws.onmessage = (event) => {
        onMessage?.(event)
      }

      ws.onerror = (error) => {
        onError?.(error)
        toast({
          title: 'Connection Error',
          description: 'There was a problem with the interview connection. Attempting to reconnect...',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      toast({
        title: 'Connection Error',
        description: 'Failed to establish connection to the interview server.',
        variant: 'destructive',
      })
    }
  }, [url, onMessage, onOpen, onClose, onError, maxReconnectAttempts, reconnectInterval, toast])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

  return {
    isConnected,
    isReconnecting,
    send,
    disconnect
  }
}
