'use client'

import { useEffect, useRef, useState } from 'react'
import { WebSocketMessage } from '@/lib/websocket-server'

interface UseWebSocketOptions {
  url: string
  reconnectAttempts?: number
  reconnectInterval?: number
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
}

export const useWebSocket = ({
  url,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onMessage,
  onError,
  onOpen,
  onClose
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const baseReconnectInterval = useRef(reconnectInterval)

  const connect = () => {
    if (isConnecting || !url) return // Don't connect if no URL provided
    
    setIsConnecting(true)
    
    try {
      // Clear any existing connection
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      
      wsRef.current = new WebSocket(url)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0
        console.log('WebSocket connected successfully')
        onOpen?.()
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          setError('Failed to parse server message')
        }
      }
      
      wsRef.current.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        
        let closeReason = 'Connection closed'
        if (event.code === 1006) {
          closeReason = 'Connection lost unexpectedly'
        } else if (event.code === 1000) {
          closeReason = 'Connection closed normally'
        } else if (event.code === 1001) {
          closeReason = 'Server going away'
        }
        
        console.log(`WebSocket closed: ${closeReason} (code: ${event.code})`)
        onClose?.()
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++
          const backoffDelay = Math.min(
            baseReconnectInterval.current * Math.pow(2, reconnectAttemptsRef.current - 1),
            30000 // Cap at 30 seconds
          )
          
          setError(`${closeReason}. Reconnecting in ${Math.round(backoffDelay / 1000)}s... (${reconnectAttemptsRef.current}/${reconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, backoffDelay)
        } else {
          setError('Connection failed. Maximum reconnection attempts reached. Real-time updates unavailable.')
        }
      }
      
      wsRef.current.onerror = (error) => {
        setIsConnecting(false)
        console.error('WebSocket error:', error)
        
        const errorMessage = wsRef.current?.readyState === WebSocket.CONNECTING 
          ? 'Failed to connect to real-time server. Check if the server is running on port 8080.'
          : 'WebSocket connection error occurred'
          
        setError(errorMessage)
        onError?.(error)
      }
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          setError('Connection timeout. Server may be unavailable.')
          wsRef.current.close()
          setIsConnecting(false)
        }
      }, 10000) // 10 second timeout
      
      // Clear timeout on successful connection
      const originalOnOpen = wsRef.current.onopen
      wsRef.current.onopen = (event) => {
        clearTimeout(connectionTimeout)
        if (originalOnOpen && wsRef.current) {
          originalOnOpen.call(wsRef.current, event)
        }
      }
      
    } catch (err) {
      setIsConnecting(false)
      const errorMessage = err instanceof Error ? err.message : 'Failed to establish WebSocket connection'
      setError(errorMessage)
      console.error('WebSocket connection error:', err)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }

  const sendMessage = (message: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected. Cannot send message.')
    }
  }

  useEffect(() => {
    if (url) {
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
  }, [url]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  }
}