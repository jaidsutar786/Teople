import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  getAdminHomeData,
  getAllActiveSessions,
  adminGetEmployeeWorkDetails,
  adminGetDetailedSession,
  getOneTimeISTTime,
  getClientISTTime,
  shouldSyncWithServer
} from '../api';
import { toast } from 'react-hot-toast';
import "../css/AdminHome.css";

const AdminHome = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTimeIST, setCurrentTimeIST] = useState('');
  const [, forceUpdate] = useState({});

  useEffect(() => {
    fetchAdminData();
    const cleanup = setupISTClock();
    
    // Update durations every second for live timer
    const durationInterval = setInterval(() => {
      forceUpdate({});
    }, 1000);
    
    return () => {
      cleanup();
      clearInterval(durationInterval);
    };
  }, []); // Empty dependency - runs only once

  // Enhanced IST Clock Setup with Server Sync
  const setupISTClock = () => {
    // One-time server sync during initial setup
    const performOneTimeSync = async () => {
      try {
        const serverTimeResponse = await getOneTimeISTTime();
        const serverIST = serverTimeResponse.data.current_ist_time;
        setCurrentTimeIST(serverIST);
        console.log('✅ One-time server time sync completed');
      } catch (error) {
        // If server fails, use client time directly
        const clientIST = getClientISTTime();
        setCurrentTimeIST(clientIST);
        console.log('⚠️ Using client IST time');
      }
    };

    // Do one-time sync when component mounts
    performOneTimeSync();

    // Then use client-side only updates (NO MORE API CALLS)
    const updateISTTime = () => {
      const clientIST = getClientISTTime();
      setCurrentTimeIST(clientIST);
    };

    // Update every second using client time only
    const interval = setInterval(updateISTTime, 1000);

    return () => {
      clearInterval(interval);
      console.log('🕒 IST clock cleanup');
    };
  };

  // Client-side IST calculation (fallback - using imported function)
  const calculateClientIST = (date) => {
    return getClientISTTime(date);
  };

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [homeData, sessionsData] = await Promise.all([
        getAdminHomeData(),
        getAllActiveSessions()
      ]);

      console.log('📊 Dashboard Data:', homeData);
      console.log('🔄 Active Sessions:', sessionsData);

      setDashboardData(homeData);
      setActiveSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load monitoring dashboard');
    } finally {
      setLoading(false);
    }
  }, []); // Memoized - won't recreate on re-renders

  const handleViewEmployeeDetails = useCallback(async (employeeId) => {
    try {
      if (!employeeId || employeeId === 'undefined') {
        console.error('Employee ID is invalid:', employeeId);
        toast.error('Invalid employee ID');
        return;
      }

      console.log('🔄 Fetching details for employee:', employeeId);

      const details = await adminGetEmployeeWorkDetails(employeeId);
      console.log('✅ Employee details loaded:', details);

      setEmployeeDetails(details);
      setSelectedEmployee(employeeId);
      toast.success(`Loaded details for ${details.employee.name}`);
    } catch (error) {
      console.error('❌ Error fetching employee details:', error);
      toast.error('Failed to load employee details');
    }
  }, []);

  const handleViewSessionDetails = useCallback(async (sessionId) => {
    try {
      console.log('🔄 Fetching session details:', sessionId);

      const details = await adminGetDetailedSession(sessionId);
      console.log('✅ Session details loaded:', details);

      setSessionDetails(details);
      toast.success('Session details loaded');
    } catch (error) {
      console.error('❌ Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  }, []);

  // Accurate Duration Calculation
  const formatDuration = (startTime) => {
    if (!startTime) return '0h 0m';
    
    try {
      let start;
      
      if (typeof startTime === 'string') {
        const cleanTime = startTime.replace(' IST', '').trim();
        
        // Try parsing DD-MM-YYYY HH:MM AM/PM format
        const ampmMatch = cleanTime.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (ampmMatch) {
          const [, day, month, year, hour, minute, period] = ampmMatch;
          let hour24 = parseInt(hour);
          
          if (period.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          start = new Date(`${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:00`);
        } else {
          start = new Date(cleanTime);
          
          if (isNaN(start.getTime())) {
            const parts = cleanTime.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
              const [, day, month, year, hour, minute, second] = parts;
              start = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
            }
          }
        }
      } else {
        start = new Date(startTime);
      }
      
      if (isNaN(start.getTime())) {
        return '0h 0m';
      }
      
      const now = new Date();
      const diffMs = now - start;
      
      if (diffMs < 0) return '0h 0m';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return '0h 0m';
    }
  };

  // Accurate IST Time Formatting
  const formatTimeIST = (dateString) => {
    if (!dateString) return '';

    try {
      // If already in IST format from backend, return as is
      if (dateString.includes('IST')) {
        return dateString;
      }

      // Convert UTC to IST using imported function
      const date = new Date(dateString);
      return getClientISTTime(date);
    } catch (error) {
      console.error('Error formatting IST time:', error);
      return dateString || 'Invalid Date';
    }
  };

  const refreshData = useCallback(() => {
    fetchAdminData();
    toast.success('Dashboard data refreshed');
  }, [fetchAdminData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading professional monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 sm:py-4 lg:py-6">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        {/* Header */}
        <div className="mb-3 sm:mb-4 lg:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                Professional Work Monitoring 🎯
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                Real-time employee work tracking
              </p>
            </div>
            <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
              <button
                onClick={refreshData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-lg"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <div className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg text-center flex-1 lg:flex-none">
                <div className="text-base sm:text-lg font-bold font-mono">
                  {currentTimeIST}
                </div>
                <div className="text-blue-100 text-xs mt-0.5">
                  🇮🇳 IST
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 lg:p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Employees</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{dashboardData?.total_employees || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 lg:p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Active</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{dashboardData?.active_work_sessions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 lg:p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{dashboardData?.pending_requests || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-3 lg:p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shadow-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Depts</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900">{dashboardData?.department_activity?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Active Sessions */}
          <div className="xl:col-span-2 bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-4 lg:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                Active Sessions
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
                  {activeSessions.length}
                </span>
              </h2>
              <button
                onClick={refreshData}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
              {activeSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">No active work sessions</p>
                  <p className="text-sm mt-1">Active sessions will appear here when employees start working</p>
                </div>
              ) : (
                activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 hover:border-green-300 transition-all duration-200 group hover:shadow-md"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {session.employee_name}
                          </h4>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            Live
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {session.department} • {session.session_type?.replace('_', ' ')}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Started: {formatTimeIST(session.start_time_ist || session.start_time)}
                          </div>
                        </div>

                        {/* Compact Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/50 p-3 rounded-xl border border-green-200">
                            <div className="text-gray-600 text-sm">Duration</div>
                            <div className="font-semibold text-green-600 text-lg">
                              {formatDuration(session.start_time_ist || session.start_time)}
                            </div>
                          </div>
                          <div className="bg-white/50 p-3 rounded-xl border border-green-200">
                            <div className="text-gray-600 text-sm">Productivity</div>
                            <div className="font-semibold text-blue-600 text-lg">
                              {session.productivity_score || 0}%
                            </div>
                          </div>
                        </div>

                        {/* Work Plan */}
                        {session.start_note && (
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="text-sm font-medium text-blue-800 mb-1">Work Plan:</div>
                            <div className="text-sm text-blue-700 line-clamp-2">{session.start_note}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (session.employee_id) {
                            handleViewEmployeeDetails(session.employee_id);
                          } else {
                            console.error('No employee_id found in session:', session);
                            toast.error('Employee ID not available for this session');
                          }
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${session.employee_id
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          }`}
                        disabled={!session.employee_id}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {session.employee_id ? 'View Employee' : 'ID Missing'}
                      </button>
                      <button
                        onClick={() => handleViewSessionDetails(session.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Session Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Employee Details Panel */}
          <div className="xl:col-span-1 bg-white rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 lg:p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg sm:rounded-xl">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                {employeeDetails ? employeeDetails.employee.name : 'Employee Details'}
              </h2>
              {employeeDetails && (
                <button
                  onClick={() => {
                    setEmployeeDetails(null);
                    setSelectedEmployee(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6 max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
              {!employeeDetails ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Select an Employee</p>
                  <p className="text-sm mt-1">Click "View Employee" on any active session to see detailed information</p>
                </div>
              ) : (
                <>
                  {/* Employee Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 text-xl mb-4">
                      {employeeDetails.employee.name}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium capitalize">{employeeDetails.employee.department}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium">{employeeDetails.employee.position}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{employeeDetails.employee.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Work Statistics */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Performance Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">
                          {employeeDetails.work_statistics.total_sessions}
                        </div>
                        <div className="text-sm text-blue-800 font-medium">Total Sessions</div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                          {employeeDetails.work_statistics.completed_sessions}
                        </div>
                        <div className="text-sm text-green-800 font-medium">Completed</div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 text-center border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600">
                          {employeeDetails.work_statistics.total_hours_worked.toFixed(1)}
                        </div>
                        <div className="text-sm text-purple-800 font-medium">Total Hours</div>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 text-center border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600">
                          {employeeDetails.work_statistics.average_productivity.toFixed(0)}%
                        </div>
                        <div className="text-sm text-orange-800 font-medium">Avg Productivity</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Sessions */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">Recent Sessions</h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {employeeDetails.recent_sessions.length} sessions
                      </span>
                    </div>
                    <div className="space-y-4">
                      {employeeDetails.recent_sessions.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <p>No work sessions found</p>
                        </div>
                      ) : (
                        employeeDetails.recent_sessions.map((sessionData, index) => (
                          <div
                            key={sessionData.session.id}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 capitalize text-sm">
                                  {sessionData.session.session_type?.replace('_', ' ')}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatTimeIST(sessionData.start_time_ist)}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${sessionData.session.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : sessionData.session.status === 'active'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {sessionData.session.status}
                              </span>
                            </div>

                            {sessionData.start_note && (
                              <div className="text-sm text-gray-600 mb-2 bg-white/50 p-2 rounded-lg border border-gray-200">
                                <span className="font-medium">Plan:</span> {sessionData.start_note}
                              </div>
                            )}

                            {sessionData.work_completed && (
                              <div className="text-sm text-gray-700 bg-blue-50 p-2 rounded-lg border border-blue-200">
                                <span className="font-medium">Completed:</span> {sessionData.work_completed}
                              </div>
                            )}

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleViewSessionDetails(sessionData.session.id)}
                                className="flex-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-3 rounded-lg transition-colors font-medium"
                              >
                                View Details
                              </button>
                              <div className="text-xs text-gray-500 bg-white px-3 py-2 rounded-lg border border-gray-200 font-medium">
                                {sessionData.session.total_hours || 0}h • {sessionData.session.productivity_score || 0}%
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Session Details Modal */}
        {sessionDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-3xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Session Detailed Report</h3>
                    <p className="text-gray-600 mt-2 text-lg">
                      {sessionDetails.employee.name} • {sessionDetails.session.session_type?.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSessionDetails(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Session Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {sessionDetails.session.total_hours || 0}h
                    </div>
                    <div className="text-sm text-blue-800 font-medium mt-1">Duration</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {sessionDetails.session.productivity_score || 0}%
                    </div>
                    <div className="text-sm text-green-800 font-medium mt-1">Productivity</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {sessionDetails.session.keyboard_activity || 0}
                    </div>
                    <div className="text-sm text-purple-800 font-medium mt-1">Keystrokes</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 text-center border border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">
                      {sessionDetails.session.mouse_activity || 0}
                    </div>
                    <div className="text-sm text-orange-800 font-medium mt-1">Mouse Activity</div>
                  </div>
                </div>

                {/* Start and End Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <h4 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        </svg>
                      </div>
                      Session Start
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-green-200">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Time:</span>
                        <span className="text-sm text-gray-600">{sessionDetails.start_time_ist}</span>
                      </div>
                      {sessionDetails.session.start_note && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Start Note:</p>
                          <p className="text-sm text-gray-600 bg-white p-4 rounded-xl border border-green-200">
                            {sessionDetails.session.start_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
                    <h4 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-xl">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                      </div>
                      Session End
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl border border-red-200">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Time:</span>
                        <span className="text-sm text-gray-600">{sessionDetails.end_time_ist || 'Still active'}</span>
                      </div>
                      {sessionDetails.session.end_note && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">End Note:</p>
                          <p className="text-sm text-gray-600 bg-white p-4 rounded-xl border border-red-200">
                            {sessionDetails.session.end_note}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Work Completed */}
                {sessionDetails.session.work_completed && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200">
                    <h4 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Work Completed
                    </h4>
                    <p className="text-sm text-gray-700 bg-white p-4 rounded-xl border border-emerald-200">
                      {sessionDetails.session.work_completed}
                    </p>
                  </div>
                )}

                {/* Activity Notes */}
                {sessionDetails.activity_logs && sessionDetails.activity_logs.filter(log => log.activity_type === 'note_added').length > 0 && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                    <h4 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                      Session Notes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {sessionDetails.activity_logs
                        .filter(log => log.activity_type === 'note_added')
                        .map((log, index) => (
                          <div key={index} className="bg-white rounded-xl p-4 border border-purple-200 hover:border-purple-300 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-medium text-purple-700 bg-purple-50 px-3 py-1 rounded-full capitalize">
                                {log.details?.note_type?.replace('_', ' ') || 'General Note'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTimeIST(log.timestamp_ist || log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{log.note}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;