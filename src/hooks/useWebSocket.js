import { useEffect, useState, useRef } from 'react'
import { toast } from 'react-hot-toast'

export const useWebSocket = () => {
  const [notifications, setNotifications] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      const wsBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws')
      const wsUrl = `${wsBase}/ws/notifications/?token=${token}`
      socketRef.current = new WebSocket(wsUrl)

      socketRef.current.onopen = () => {
        console.log('🔗 WebSocket connected')
        setIsConnected(true)
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      }

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Received notification:', data)
          
          if (data.type === 'notification' && data.message) {
            const notification = data.message
            
            setNotifications(prev => [notification, ...prev.slice(0, 49)])
            
            const statusColor = notification.status === 'Approved' ? '✅' : 
                               notification.status === 'Rejected' ? '❌' : '⏳'
            
            toast.success(`${statusColor} ${notification.message}`, {
              duration: 5000,
              position: 'top-right'
            })
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      socketRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code)
        setIsConnected(false)
        
        // Don't reconnect if auth rejected
        if (event.code === 1000 || event.code === 4001 || event.code === 1008) return
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connect()
        }, 3000)
      }

      socketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setIsConnected(false)
      }

    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000)
      socketRef.current = null
    }
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [])

  return {
    notifications,
    isConnected,
    clearNotifications,
    reconnect: connect
  }
}