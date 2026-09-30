import { useEffect, useRef, useState } from 'react'

export interface DiffSocketEvent {
  type: string
  [key: string]: unknown
}

const HTTP_API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const WS_API_URL = HTTP_API_URL.replace(/^http/, 'ws')

export function useDiffSocket(reviewId: string | null) {
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<DiffSocketEvent | null>(null)

  useEffect(() => {
    if (!reviewId) return undefined

    const token = localStorage.getItem('access_token')
    if (!token) return undefined

    let active = true
    let pingTimer: ReturnType<typeof setInterval> | null = null

    const connect = () => {
      if (!active) return
      const socket = new WebSocket(`${WS_API_URL}/api/v1/reviews/${reviewId}/ws?token=${encodeURIComponent(token)}`)
      socketRef.current = socket

      socket.onopen = () => {
        if (!active) return
        reconnectAttemptsRef.current = 0
        setIsConnected(true)
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }))
        }, 30000)
      }

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as DiffSocketEvent
          setLastEvent(parsed)
        } catch {
          // Ignore non-JSON messages from the collaboration server.
        }
      }

      socket.onerror = () => socket.close()
      socket.onclose = () => {
        if (pingTimer) clearInterval(pingTimer)
        setIsConnected(false)
        if (active && reconnectAttemptsRef.current < 3) {
          reconnectAttemptsRef.current += 1
          reconnectTimerRef.current = setTimeout(connect, 3000)
        }
      }
    }

    connect()
    return () => {
      active = false
      if (pingTimer) clearInterval(pingTimer)
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [reviewId])

  function sendMessage(message: object) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message))
    }
  }

  return { isConnected, lastEvent, sendMessage }
}