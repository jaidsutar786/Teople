import { useEffect, useState, useRef } from 'react';
import { BellIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../context/NotificationContext';
import { getCompOffUsageNotifications, respondCompOffNotification } from '../api';

const BATCH_SIZE = 10
const BATCH_DELAY = 300

const Notifications = () => {
  const [employeeName, setEmployeeName] = useState('')
  const { employeeNotifications, clearNotifications } = useNotifications()
  const allNotifications = employeeNotifications.notifications || []

  const [compOffNotifications, setCompOffNotifications] = useState([])
  const [respondingId, setRespondingId] = useState(null)

  const [visibleNotifs, setVisibleNotifs] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setEmployeeName(user?.username || user?.email || 'Employee')
    const timer = setTimeout(() => clearNotifications(), 1000)
    fetchCompOffNotifications()
    return () => clearTimeout(timer)
  }, [])

  const fetchCompOffNotifications = async () => {
    try {
      const data = await getCompOffUsageNotifications()
      setCompOffNotifications(data.notifications || [])
    } catch (e) {
      // silent fail
    }
  }

  const handleCompOffRespond = async (notificationId, useCompOff) => {
    setRespondingId(notificationId)
    try {
      await respondCompOffNotification(notificationId, useCompOff)
      setCompOffNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (e) {
      alert(e?.response?.data?.error || 'Kuch galat hua, dobara try karo')
    } finally {
      setRespondingId(null)
    }
  }

  // Notifications batches mein load karo — delay ke saath
  useEffect(() => {
    if (allNotifications.length === 0) {
      setVisibleNotifs([])
      return
    }

    // Pehle 10 turant dikhao
    setVisibleNotifs(allNotifications.slice(0, BATCH_SIZE))

    // Agar 10 se zyada hain to baaki ek ek batch mein delay se add karo
    if (allNotifications.length > BATCH_SIZE) {
      let loaded = BATCH_SIZE
      const loadNext = () => {
        loaded += BATCH_SIZE
        setVisibleNotifs(allNotifications.slice(0, loaded))
        if (loaded < allNotifications.length) {
          timerRef.current = setTimeout(loadNext, BATCH_DELAY)
        }
      }
      timerRef.current = setTimeout(loadNext, BATCH_DELAY)
    }

    return () => clearTimeout(timerRef.current)
  }, [allNotifications])

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600">Employee: {employeeName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Notifications</p>
            <p className="text-2xl font-bold text-blue-600">{allNotifications.length + compOffNotifications.length}</p>
          </div>
        </div>
      </div>

      {/* Comp Off Usage Notifications - Action Required */}
      {compOffNotifications.length > 0 && (
        <div className="space-y-3 mb-4">
          {compOffNotifications.map((notif) => (
            <div key={`compoff_usage_${notif.id}`} className="rounded-lg shadow p-4 bg-purple-50 border-l-4 border-purple-500">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="flex-1">
                  <p className="text-purple-900 font-semibold text-sm mb-1">Comp Off Use Karna Hai?</p>
                  <p className="text-gray-700 text-sm mb-3">{notif.message}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleCompOffRespond(notif.id, true)}
                      disabled={respondingId === notif.id}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {respondingId === notif.id ? '...' : '✅ Haan, Use Karna Hai'}
                    </button>
                    <button
                      onClick={() => handleCompOffRespond(notif.id, false)}
                      disabled={respondingId === notif.id}
                      className="px-4 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium"
                    >
                      {respondingId === notif.id ? '...' : '❌ Nahi, Next Month Le Jaao'}
                    </button>
                  </div>
                  <p className="text-xs text-red-500 mt-2">
                    ⚠️ 2 din tak reply nahi kiya to comp off discard ho jayega
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Expires: {new Date(notif.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {allNotifications.length === 0 && compOffNotifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <BellIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No notifications yet</p>
        </div>
      ) : allNotifications.length === 0 ? null : (
        <>
          <div className="space-y-3">
            {visibleNotifs.map((notif, index) => (
              <div
                key={`${notif.request_type}_${notif.request_id}_${index}`}
                style={{ animationDelay: `${(index % BATCH_SIZE) * 40}ms` }}
                className={`rounded-lg shadow p-4 flex items-start gap-4 hover:shadow-md transition-all duration-300 animate-fade-in ${
                  notif.type === 'form_revision' ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-white'
                }`}
              >
                {notif.type === 'form_revision' ? (
                  <svg className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : notif.status === 'Approved' ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{notif.message}</p>
                  {notif.status === 'Rejected' && notif.rejection_reason && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                      <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{notif.rejection_reason}</p>
                    </div>
                  )}
                  {notif.type === 'form_revision' && notif.incomplete_fields?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-orange-700 mb-1">Incomplete Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {notif.incomplete_fields.map((field, idx) => (
                          <span key={idx} className="inline-block bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(notif.date).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator jab baaki notifications aa rahi hain */}
          {visibleNotifs.length < allNotifications.length && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                Loading {allNotifications.length - visibleNotifs.length} more...
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease both;
        }
      `}</style>
    </div>
  )
}

export default Notifications
