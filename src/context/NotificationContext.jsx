import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getPendingRequestsCount, getEmployeeNotifications, getAllActiveSessions } from '../api'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export const NotificationProvider = ({ children }) => {
  const [pendingRequests, setPendingRequests] = useState({ total: 0, leave: 0, wfh: 0, comp_off: 0 })
  const [employeeNotifications, setEmployeeNotifications] = useState({ total: 0, approved: 0, rejected: 0, notifications: [] })
  const [liveWorkingCount, setLiveWorkingCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const loadingRef = useRef(false)  // duplicate calls prevent karo

  const role = localStorage.getItem('role')

  // ✅ Sirf initial load par ek baar API call - WebSocket ke liye nahi
  const loadInitialData = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    if (loadingRef.current) return
    loadingRef.current = true

    try {
      if (role === 'admin') {
        const data = await getPendingRequestsCount()
        setPendingRequests({
          total: data.total_pending || 0,
          leave: data.leave_pending || 0,
          wfh: data.wfh_pending || 0,
          comp_off: data.comp_off_pending || 0
        })
      } else if (role === 'employee') {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const employeeId = user.id || user.employee_id

        // Purane keys cleanup karo jo ab use nahi hote
        localStorage.removeItem(`lastNotificationCheck_${employeeId}`)
        localStorage.removeItem(`notificationsLoaded_${employeeId}`)

        // Viewed IDs jo user ne already dekh liye hain
        const viewedIds = JSON.parse(localStorage.getItem(`viewedNotifications_${employeeId}`) || '[]')

        // Saari notifications fetch karo (no lastCheck filter - backend pe filter nahi karna)
        const data = await getEmployeeNotifications()

        // Sirf unviewed dikhao
        const unviewed = (data.notifications || []).filter(n => {
          const id = `${n.request_type}_${n.request_id}`
          return !viewedIds.includes(id)
        })

        setEmployeeNotifications({
          total: unviewed.length,
          approved: unviewed.filter(n => n.status === 'Approved').length,
          rejected: unviewed.filter(n => n.status === 'Rejected').length,
          notifications: unviewed
        })
      }
    } catch (err) {
      console.error('Failed to load initial notifications:', err)
    } finally {
      loadingRef.current = false
    }
  }, [role])

  // ✅ Live working count alag se load karo - notification se mix mat karo
  const loadLiveWorkingCount = useCallback(async () => {
    if (role !== 'admin') return
    try {
      const sessions = await getAllActiveSessions()
      setLiveWorkingCount(sessions.length || 0)
    } catch { }
  }, [role])

  // ✅ WebSocket - sirf ek baar connect, state directly update karo (no API call)
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token || !role) return

    // Initial data load - sirf ek baar
    loadInitialData()
    if (role === 'admin') loadLiveWorkingCount()

    const connect = () => {
      const wsBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace('http', 'ws')
      const ws = new WebSocket(`${wsBase}/ws/notifications/?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => setIsConnected(true)

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)

          // ✅ Admin: pending counts seedha state mein update - NO API CALL
          if (msg.type === 'pending_counts' && role === 'admin') {
            setPendingRequests({
              total: (msg.data.leave || 0) + (msg.data.wfh || 0) + (msg.data.comp_off || 0),
              leave: msg.data.leave || 0,
              wfh: msg.data.wfh || 0,
              comp_off: msg.data.comp_off || 0,
            })
          }

          // ✅ Employee: notification seedha state mein add karo - NO API CALL
          if (msg.type === 'notification' && role === 'employee') {
            const newNotif = msg.message
            if (!newNotif) return

            const user = JSON.parse(localStorage.getItem('user') || '{}')
            const employeeId = user.id || user.employee_id
            const viewedIds = JSON.parse(localStorage.getItem(`viewedNotifications_${employeeId}`) || '[]')
            const notifId = `${newNotif.type}_${newNotif.id}`

            // Already viewed hai to skip karo
            if (viewedIds.includes(notifId)) return

            setEmployeeNotifications(prev => {
              const exists = prev.notifications.some(
                n => `${n.request_type}_${n.request_id}` === notifId
              )
              if (exists) return prev
              const updated = [newNotif, ...prev.notifications]
              return {
                total: updated.length,
                approved: updated.filter(n => n.status === 'Approved').length,
                rejected: updated.filter(n => n.status === 'Rejected').length,
                notifications: updated
              }
            })
          }
        } catch { }
      }

      ws.onclose = (e) => {
        setIsConnected(false)
        // Auth rejected - reconnect mat karo
        if (e.code === 1008 || e.code === 4001 || e.code === 4003) return
        reconnectTimerRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [role])

  // ✅ Tab visible hone par sirf reconnect check karo - API call nahi
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && wsRef.current?.readyState !== WebSocket.OPEN) {
        // WebSocket band ho gaya tab hidden tha - reconnect hoga automatically via onclose
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // ✅ Manual refresh - sirf jab user explicitly refresh kare (bell click etc.)
  const refreshNotifications = useCallback(() => {
    loadInitialData()
  }, [loadInitialData])

  const clearNotifications = useCallback(() => {
    if (role !== 'employee') return
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const employeeId = user.id || user.employee_id

    setEmployeeNotifications(prev => {
      // Saari current notifications ko viewed mark karo aur array bhi clear karo
      const newViewedIds = prev.notifications.map(n => `${n.request_type}_${n.request_id}`)
      const existingViewed = JSON.parse(localStorage.getItem(`viewedNotifications_${employeeId}`) || '[]')
      localStorage.setItem(`viewedNotifications_${employeeId}`, JSON.stringify([...new Set([...existingViewed, ...newViewedIds])]))
      // total 0 karo aur notifications array bhi clear karo
      return { total: 0, approved: 0, rejected: 0, notifications: [] }
    })
  }, [role])

  return (
    <NotificationContext.Provider value={{
      pendingRequests,
      employeeNotifications,
      liveWorkingCount,
      refreshNotifications,
      clearNotifications,
      isConnected
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
