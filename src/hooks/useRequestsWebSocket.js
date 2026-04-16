import { useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://127.0.0.1:8000/ws/notifications/'

export const useRequestsWebSocket = (onMessage) => {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    ws.current = new WebSocket(`${WS_URL}?token=${token}`)

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onMessageRef.current(data)
      } catch { }
    }

    ws.current.onclose = (e) => {
      // code 4001 = auth rejected, don't reconnect
      if (e.code === 4001 || e.code === 1008) return
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [])

  useEffect(() => {
    // TEMPORARILY DISABLED
    // connect()
    // return () => {
    //   clearTimeout(reconnectTimer.current)
    //   ws.current?.close()
    // }
  }, [connect])
}
