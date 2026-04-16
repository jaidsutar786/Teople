import { useState, useEffect } from 'react';
import { getEmployeeNotifications, getRevisionRequestNotifications } from '../api';
import { BellIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../context/NotificationContext';
import { getCompOffUsageNotifications, respondCompOffNotification } from '../api';

const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [compOffNotifications, setCompOffNotifications] = useState([]);
  const [respondingId, setRespondingId] = useState(null);
  const { clearNotifications } = useNotifications();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchCompOffNotifications();
      const timer = setTimeout(() => {
        clearNotifications();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await getEmployeeNotifications(null);
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompOffNotifications = async () => {
    try {
      const data = await getCompOffUsageNotifications();
      setCompOffNotifications(data.notifications || []);
    } catch (e) {
      // silent fail
    }
  };

  const handleCompOffRespond = async (notificationId, useCompOff) => {
    setRespondingId(notificationId);
    try {
      await respondCompOffNotification(notificationId, useCompOff);
      setCompOffNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (e) {
      alert(e?.response?.data?.error || 'Kuch galat hua, dobara try karo');
    } finally {
      setRespondingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 z-50 h-full">
      <div className="bg-white border-l border-gray-300 shadow-2xl w-96 h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <BellIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {notifications.length + compOffNotifications.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 && compOffNotifications.length === 0 ? (
            <div className="text-center py-8">
              <BellIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Comp Off Usage Notifications - Action Required */}
              {compOffNotifications.map((notif) => (
                <div key={`compoff_usage_${notif.id}`} className="rounded-lg p-3 bg-purple-50 border border-purple-300">
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">🎯</span>
                    <div className="flex-1">
                      <p className="text-purple-900 font-semibold text-xs mb-1">Comp Off Use Karna Hai?</p>
                      <p className="text-gray-700 text-xs mb-2">{notif.message}</p>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleCompOffRespond(notif.id, true)}
                          disabled={respondingId === notif.id}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                        >
                          {respondingId === notif.id ? '...' : '✅ Haan'}
                        </button>
                        <button
                          onClick={() => handleCompOffRespond(notif.id, false)}
                          disabled={respondingId === notif.id}
                          className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50 font-medium"
                        >
                          {respondingId === notif.id ? '...' : '❌ Next Month'}
                        </button>
                      </div>
                      <p className="text-xs text-red-500 mt-1">⚠️ 2 din me reply nahi = discard</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Notifications */}
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 flex items-start gap-3 ${
                    notif.type === 'form_revision' ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                  }`}
                >
                  {notif.type === 'form_revision' ? (
                    <svg className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : notif.status === 'Approved' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm font-medium">{notif.message}</p>
                    {notif.status === 'Rejected' && notif.rejection_reason && (
                      <div className="mt-1.5 bg-red-50 border border-red-200 rounded-md px-2 py-1">
                        <p className="text-xs font-semibold text-red-600">Rejection Reason:</p>
                        <p className="text-xs text-red-700">{notif.rejection_reason}</p>
                      </div>
                    )}
                    {notif.type === 'form_revision' && notif.incomplete_fields && notif.incomplete_fields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-orange-700 mb-1">Incomplete Fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {notif.incomplete_fields.map((field, idx) => (
                            <span key={idx} className="inline-block bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notif.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;