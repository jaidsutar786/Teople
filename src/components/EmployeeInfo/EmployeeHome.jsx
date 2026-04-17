// import React, { useState, useEffect } from 'react';
// import { 
//   getEmployeeHomeData, 
//   startWorkSessionWithNotes, 
//   endWorkSessionWithReport,
//   addSessionNote,
//   getSessionDetails,
//   getOneTimeISTTime,
//   getClientISTTime,
//   getLeaves
// } from '../../api';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-hot-toast';
// import './EmployeeHome.css';

// const EmployeeHome = () => {
//   const navigate = useNavigate();
//   const [dashboardData, setDashboardData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeSession, setActiveSession] = useState(null);
//   const [sessionDuration, setSessionDuration] = useState('00:00:00');
//   const [currentTimeIST, setCurrentTimeIST] = useState('');
//   const [showStartModal, setShowStartModal] = useState(false);
//   const [showEndModal, setShowEndModal] = useState(false);
//   const [showNoteModal, setShowNoteModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState(null);
//   const [sessionNotes, setSessionNotes] = useState([]);
//   const [timeSynced, setTimeSynced] = useState(false);
//   const [revisionData, setRevisionData] = useState(null);
//   const [leaveStats, setLeaveStats] = useState({ total: 18, used: 0, remaining: 18 });
//   const [leaveHistory, setLeaveHistory] = useState([]);

//   // Form states
//   const [startForm, setStartForm] = useState({ 
//     start_note: '', 
//     tasks_planned: [''],
//     energy_level: 3
//   });
//   const [endForm, setEndForm] = useState({
//     end_note: '',
//     work_completed: '',
//     tasks_accomplished: [''],
//     challenges_faced: '',
//     next_day_plan: '',
//     focus_quality: 3,
//     meetings_attended: 0,
//     blockers: ''
//   });
//   const [noteForm, setNoteForm] = useState({
//     note: '',
//     note_type: 'progress'
//   });

//   useEffect(() => {
//     initializeApp();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       await performOneTimeTimeSync();
//       await fetchEmployeeHomeData();
//       setupLocalISTClock();
//     } catch (error) {
//       console.error('App initialization error:', error);
//     }
//   };

//   const performOneTimeTimeSync = async () => {
//     const lastSync = localStorage.getItem('last_time_sync');
//     const shouldSync = !lastSync || (new Date() - new Date(lastSync)) > (30 * 60 * 1000);
    
//     if (shouldSync) {
//       try {
//         await getOneTimeISTTime();
//       } catch (error) {
//         console.log('Using client time as fallback');
//       }
//     }
    
//     setCurrentTimeIST(getClientISTTime());
//   };

//   const setupLocalISTClock = () => {
//     const interval = setInterval(() => {
//       setCurrentTimeIST(getClientISTTime());
      
//       if (activeSession) {
//         const startTime = activeSession.start_time_ist || activeSession.start_time;
//         if (startTime) {
//           updateSessionDuration(startTime);
//         }
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   };

//   const fetchEmployeeHomeData = async () => {
//     try {
//       setLoading(true);
//       const data = await getEmployeeHomeData();
      
//       if (data.revision_requested) {
//         setRevisionData({
//           message: data.revision_message,
//           incomplete_fields: data.incomplete_fields || []
//         });
//       } else {
//         setRevisionData(null);
//       }
      
//       setDashboardData(data);
//       setActiveSession(data.active_work_session);

//       // Load leave stats from leave requests
//       try {
//         const leaves = await getLeaves()
//         const approved = leaves.filter(l => l.status === 'Approved')
//         const currentYear = new Date().getFullYear()
//         const usedThisYear = approved.filter(l => {
//           const leaveYear = new Date(l.start_date || l.date).getFullYear()
//           return leaveYear === currentYear
//         }).reduce((sum, l) => {
//           // count days between start_date and end_date
//           if (l.start_date && l.end_date) {
//             const start = new Date(l.start_date)
//             const end = new Date(l.end_date)
//             const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
//             return sum + days
//           }
//           return sum + 1
//         }, 0)
//         const totalLeaves = 18
//         setLeaveStats({ total: totalLeaves, used: usedThisYear, remaining: Math.max(0, totalLeaves - usedThisYear) })
//         // Store approved leaves for history display
//         const sorted = approved.sort((a, b) => new Date(b.start_date || b.date) - new Date(a.start_date || a.date))
//         setLeaveHistory(sorted)
//       } catch (e) {
//         console.error('Failed to load leave stats:', e)
//       }
      
//       if (data.active_work_session) {
//         fetchSessionNotes(data.active_work_session.id);
//         const startTime = data.active_work_session.start_time_ist || data.active_work_session.start_time;
//         setupSessionTimer(startTime);
//       }
//     } catch (error) {
//       console.error('Error fetching employee home data:', error);
//       toast.error('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchSessionNotes = async (sessionId) => {
//     try {
//       const sessionData = await getSessionDetails(sessionId);
//       setSessionNotes(sessionData.activity_logs.filter(log => 
//         log.activity_type === 'note_added'
//       ));
//     } catch (error) {
//       console.error('Error fetching session notes:', error);
//     }
//   };

//   const updateSessionDuration = (startTime) => {
//     if (!startTime) {
//       setSessionDuration('00:00:00');
//       return;
//     }

//     try {
//       let start;
      
//       if (typeof startTime === 'string') {
//         const cleanTime = startTime.replace(' IST', '').trim();
//         const ampmMatch = cleanTime.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
//         if (ampmMatch) {
//           const [, day, month, year, hour, minute, period] = ampmMatch;
//           let hour24 = parseInt(hour);
          
//           if (period.toUpperCase() === 'PM' && hour24 !== 12) {
//             hour24 += 12;
//           } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
//             hour24 = 0;
//           }
          
//           start = new Date(`${year}-${month}-${day}T${hour24.toString().padStart(2, '0')}:${minute}:00`);
//         } else {
//           start = new Date(cleanTime);
          
//           if (isNaN(start.getTime())) {
//             const parts = cleanTime.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
//             if (parts) {
//               const [, day, month, year, hour, minute, second] = parts;
//               start = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
//             }
//           }
//         }
//       } else {
//         start = new Date(startTime);
//       }
      
//       const now = new Date();
      
//       if (isNaN(start.getTime()) || isNaN(now.getTime())) {
//         setSessionDuration('00:00:00');
//         return;
//       }
      
//       const diffMs = now - start;
      
//       if (diffMs < 0) {
//         setSessionDuration('00:00:00');
//         return;
//       }
      
//       const hours = Math.floor(diffMs / (1000 * 60 * 60));
//       const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
//       const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//       setSessionDuration(duration);
//     } catch (error) {
//       console.error('Error calculating session duration:', error);
//       setSessionDuration('00:00:00');
//     }
//   };

//   const setupSessionTimer = (startTime) => {
//     const updateTimer = () => {
//       updateSessionDuration(startTime);
//     };

//     updateTimer();
//     const interval = setInterval(updateTimer, 1000);
//     return () => clearInterval(interval);
//   };

//   const formatTimeIST = (dateString) => {
//     if (!dateString) return '';
    
//     try {
//       if (dateString.includes('IST')) {
//         return dateString;
//       }
      
//       const date = new Date(dateString);
//       return getClientISTTime(date);
//     } catch (error) {
//       return dateString || 'Invalid Date';
//     }
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-IN', {
//       timeZone: 'Asia/Kolkata',
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const manualRefreshTime = async () => {
//     try {
//       toast.loading('Refreshing time with server...');
//       const response = await getOneTimeISTTime();
//       setCurrentTimeIST(response.data.current_ist_time);
//       setTimeSynced(true);
//       toast.success('Time refreshed successfully!');
//     } catch (error) {
//       toast.error('Failed to refresh time');
//     }
//   };

//   const handleStartWork = (request, sessionType) => {
//     setSelectedRequest({ ...request, sessionType });
//     setShowStartModal(true);
//   };

//   const submitStartWork = async () => {
//     try {
//       if (!startForm.start_note.trim()) {
//         toast.error('Please add a start note describing your work plan');
//         return;
//       }

//       const tasksPlanned = startForm.tasks_planned.filter(t => t.trim());
//       if (tasksPlanned.length === 0) {
//         toast.error('Please add at least one task you plan to work on');
//         return;
//       }

//       const response = await startWorkSessionWithNotes(
//         selectedRequest.sessionType,
//         selectedRequest.id,
//         startForm.start_note,
//         tasksPlanned,
//         startForm.energy_level
//       );

//       setActiveSession(response.data.session);
//       toast.success('Work session started successfully!');
//       fetchEmployeeHomeData();
//     } catch (error) {
//       console.error('Error starting work:', error);
//       toast.error(error.response?.data?.error || 'Failed to start work session');
//     } finally {
//       setShowStartModal(false);
//       setStartForm({ start_note: '', tasks_planned: [''], energy_level: 3 });
//     }
//   };

//   const handleEndWork = () => {
//     setShowEndModal(true);
//   };

//   const submitEndWork = async () => {
//     try {
//       if (!endForm.work_completed.trim()) {
//         toast.error('Please describe the work you completed');
//         return;
//       }

//       await endWorkSessionWithReport(activeSession.id, endForm);
//       await fetchEmployeeHomeData();

//       setActiveSession(null);
//       setShowEndModal(false);
//       setEndForm({
//         end_note: '',
//         work_completed: '',
//         tasks_accomplished: [''],
//         challenges_faced: '',
//         next_day_plan: '',
//         focus_quality: 3,
//         meetings_attended: 0,
//         blockers: ''
//       });
//       setSessionDuration('00:00:00');
      
//       toast.success('Work session completed successfully!');
//     } catch (error) {
//       console.error('Error ending work:', error);
//       toast.error(error.response?.data?.error || 'Failed to end work session');
//     }
//   };

//   const submitNote = async () => {
//     try {
//       if (!noteForm.note.trim()) {
//         toast.error('Please enter your note');
//         return;
//       }

//       await addSessionNote(activeSession.id, noteForm);
//       setNoteForm({ note: '', note_type: 'progress' });
//       setShowNoteModal(false);
      
//       toast.success('Note added successfully!');
//       fetchSessionNotes(activeSession.id);
//     } catch (error) {
//       console.error('Error adding note:', error);
//       toast.error('Failed to add note');
//     }
//   };

//   const addTaskField = () => {
//     setEndForm({
//       ...endForm,
//       tasks_accomplished: [...endForm.tasks_accomplished, '']
//     });
//   };

//   const updateTask = (index, value) => {
//     const updatedTasks = [...endForm.tasks_accomplished];
//     updatedTasks[index] = value;
//     setEndForm({
//       ...endForm,
//       tasks_accomplished: updatedTasks
//     });
//   };

//   const removeTask = (index) => {
//     const updatedTasks = endForm.tasks_accomplished.filter((_, i) => i !== index);
//     setEndForm({
//       ...endForm,
//       tasks_accomplished: updatedTasks
//     });
//   };

//   const addPlannedTask = () => {
//     setStartForm({
//       ...startForm,
//       tasks_planned: [...startForm.tasks_planned, '']
//     });
//   };

//   const updatePlannedTask = (index, value) => {
//     const updatedTasks = [...startForm.tasks_planned];
//     updatedTasks[index] = value;
//     setStartForm({
//       ...startForm,
//       tasks_planned: updatedTasks
//     });
//   };

//   const removePlannedTask = (index) => {
//     const updatedTasks = startForm.tasks_planned.filter((_, i) => i !== index);
//     setStartForm({
//       ...startForm,
//       tasks_planned: updatedTasks
//     });
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-6">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Revision Request Banner */}
//         {revisionData && (
//           <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
//             <div className="flex items-start gap-3">
//               <div className="flex-shrink-0">
//                 <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <h3 className="text-sm font-semibold text-orange-800 mb-1">Profile Incomplete</h3>
//                 <p className="text-orange-700 text-sm mb-2">{revisionData.message}</p>
//                 {revisionData.incomplete_fields.length > 0 && (
//                   <div className="mb-3">
//                     <p className="text-xs font-medium text-orange-800 mb-1">Missing Fields:</p>
//                     <div className="flex flex-wrap gap-1">
//                       {revisionData.incomplete_fields.map((field, idx) => (
//                         <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">{field}</span>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//                 <button
//                   onClick={() => navigate('/employee-form')}
//                   className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-700 transition-colors"
//                 >
//                   Complete Profile
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">Welcome back, {dashboardData?.employee?.first_name}</h1>
//               <p className="text-gray-600 mt-1">Professional Work Management System</p>
//             </div>
//             <div className="text-center lg:text-right">
//               <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
//                 <div className="text-lg font-semibold text-gray-900 font-mono">
//                   {currentTimeIST}
//                 </div>
//                 <div className="text-gray-500 text-sm mt-1">
//                   Indian Standard Time
//                 </div>
//               </div>
//               <button
//                 onClick={manualRefreshTime}
//                 className="text-sm text-orange-600 hover:text-orange-700 mt-2 flex items-center justify-center lg:justify-end gap-1 w-full lg:w-auto"
//               >
//                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//                 Sync Time
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Active Session Banner */}
//         {activeSession && (
//           <div className="mb-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
//             <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-3"></div>
//                 <div>
//                   <h3 className="text-lg font-semibold">Active Work Session</h3>
//                   <p className="text-orange-100">
//                     {activeSession.session_type?.toUpperCase()} • 
//                     Started at {formatTimeIST(activeSession.start_time_ist || activeSession.start_time)}
//                   </p>
//                 </div>
//               </div>
//               <div className="text-center">
//                 <div className="text-2xl font-mono font-bold bg-white/20 px-4 py-3 rounded-lg backdrop-blur-sm">
//                   {sessionDuration}
//                 </div>
//                 <p className="text-orange-100 text-sm mt-1">Live Session Duration</p>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => setShowNoteModal(true)}
//                   className="bg-white text-orange-600 px-4 py-2 rounded text-sm font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                   </svg>
//                   Add Note
//                 </button>
//                 <button
//                   onClick={handleEndWork}
//                   className="bg-white text-red-600 px-4 py-2 rounded text-sm font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
//                 >
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
//                   </svg>
//                   End Session
//                 </button>
//               </div>
//             </div>

//             {/* Session Notes Preview */}
//             {sessionNotes.length > 0 && (
//               <div className="mt-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
//                 <h4 className="font-semibold mb-3 flex items-center gap-2">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                   </svg>
//                   Recent Notes
//                 </h4>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//                   {sessionNotes.slice(0, 3).map((note, index) => (
//                     <div key={index} className="bg-white/5 p-3 rounded border border-white/10">
//                       <div className="flex justify-between items-start mb-2">
//                         <span className="font-medium text-white text-sm">{note.note}</span>
//                       </div>
//                       <div className="text-orange-200 text-xs">
//                         {formatTimeIST(note.timestamp_ist || note.timestamp)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Main Content Grid */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//           {/* Sidebar Stats */}
//           <div className="xl:col-span-1 space-y-6">
//             {/* Quick Stats */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-orange-100 rounded-lg">
//                       <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                     <span className="font-medium text-gray-700">Comp Off Balance</span>
//                   </div>
//                   <span className="text-lg font-bold text-gray-900">{dashboardData?.comp_off_balance || 0}h</span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-green-100 rounded-lg">
//                       <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                     <span className="font-medium text-gray-700">Approved Requests</span>
//                   </div>
//                   <span className="text-lg font-bold text-gray-900">
//                     {(dashboardData?.approved_wfh_requests?.length || 0) + (dashboardData?.approved_comp_off_requests?.length || 0)}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className="p-2 bg-blue-100 rounded-lg">
//                       <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                       </svg>
//                     </div>
//                     <span className="font-medium text-gray-700">Today's Status</span>
//                   </div>
//                   <span className="text-lg font-bold text-gray-900">
//                     {dashboardData?.today_attendance ? 'Present' : 'Not Marked'}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Leave Balance + History Card */}
//             <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//               <div className="px-4 py-3 border-b border-gray-100">
//                 <h3 className="text-sm font-semibold text-gray-700 mb-3">Leave Balance</h3>
//                 <div className="grid grid-cols-3 gap-2">
//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center">
//                     <p className="text-xl font-bold text-blue-700">{leaveStats.total}</p>
//                     <p className="text-xs text-blue-500 mt-0.5">Total</p>
//                   </div>
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
//                     <p className="text-xl font-bold text-red-600">{leaveStats.used}</p>
//                     <p className="text-xs text-red-400 mt-0.5">Used</p>
//                   </div>
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
//                     <p className="text-xl font-bold text-green-600">{leaveStats.remaining}</p>
//                     <p className="text-xs text-green-400 mt-0.5">Left</p>
//                   </div>
//                 </div>
//               </div>
//               <div className="px-4 py-3">
//                 <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Leave History</p>
//                 {leaveHistory.length === 0 ? (
//                   <p className="text-xs text-gray-400 py-3 text-center">No approved leaves yet</p>
//                 ) : (
//                   <div className="space-y-1.5 max-h-60 overflow-y-auto">
//                     {leaveHistory.map((leave) => {
//                       const start = new Date(leave.start_date || leave.date)
//                       const end = leave.end_date ? new Date(leave.end_date) : start
//                       const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
//                       return (
//                         <div key={leave.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-amber-50 transition-colors">
//                           <div className="text-center bg-amber-50 border border-amber-200 rounded-md px-2 py-1 min-w-[40px] flex-shrink-0">
//                             <p className="text-base font-bold text-amber-700 leading-none">{start.getDate()}</p>
//                             <p className="text-xs text-amber-500">{start.toLocaleDateString('en-IN', { month: 'short' })}</p>
//                             <p className="text-xs text-amber-400">{start.getFullYear()}</p>
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className="text-xs font-semibold text-gray-800 truncate">
//                               {days > 1
//                                 ? `${start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`
//                                 : start.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })
//                               }
//                             </p>
//                             <p className="text-xs text-gray-400">{leave.leave_type || leave.type || 'Casual Leave'}</p>
//                           </div>
//                           <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">{days}d</span>
//                         </div>
//                       )
//                     })}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Salary Slips Card */}
//             <div 
//               className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-sm p-6 text-white cursor-pointer hover:shadow-md transition-shadow"
//               onClick={() => window.dispatchEvent(new CustomEvent('open-doc-drawer', { detail: 'salary' }))}
//             >
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
//                   </svg>
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold">Salary Slips</h3>
//                   <p className="text-orange-100 text-sm">View & Download</p>
//                 </div>
//               </div>
//               <div className="mt-4 flex items-center justify-between">
//                 <span className="text-sm text-orange-100">Access your salary information</span>
//                 <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                 </svg>
//               </div>
//             </div>
//           </div>

//           {/* Main Content - Requests */}
//           <div className="xl:col-span-2 space-y-6">
//             {/* WFH Requests */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
//                   <div className="p-2 bg-orange-100 rounded-lg">
//                     <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
//                     </svg>
//                   </div>
//                   Work From Home
//                   <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded-full font-medium">
//                     {dashboardData?.approved_wfh_requests?.length || 0}
//                   </span>
//                 </h2>
//               </div>
              
//               <div className="space-y-4">
//                 {!dashboardData?.approved_wfh_requests?.length ? (
//                   <div className="text-center py-8 text-gray-500">
//                     <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
//                       <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
//                       </svg>
//                     </div>
//                     <p className="font-medium">No approved WFH requests</p>
//                     <p className="text-sm mt-1">Your approved WFH requests will appear here</p>
//                   </div>
//                 ) : (
//                   dashboardData.approved_wfh_requests.filter(req => req.status === 'Approved').map((request) => (
//                     <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
//                       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                         <div className="flex-1">
//                           <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
//                             <h4 className="text-lg font-medium text-gray-900">
//                               {request.type} • {formatDate(request.start_date)}
//                             </h4>
//                             <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium self-start sm:self-center">
//                               Approved
//                             </span>
//                           </div>
                          
//                           <div className="space-y-2 text-sm text-gray-600">
//                             <div className="flex items-center gap-2">
//                               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                               </svg>
//                               {formatDate(request.start_date)} - {formatDate(request.end_date)}
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               Expected: {request.expected_hours}h • Worked: {request.actual_hours || 0}h
//                             </div>
//                           </div>

//                           <p className="text-sm text-gray-700 mt-3 bg-white p-3 rounded border border-gray-200">
//                             {request.reason}
//                           </p>
//                         </div>

//                         <div className="flex flex-col gap-2">
//                           {!activeSession && request.status !== 'Completed' && (
//                             <button
//                               onClick={() => handleStartWork(request, 'wfh')}
//                               className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               Start Work
//                             </button>
//                           )}

//                           {request.status === 'Completed' && (
//                             <div className="text-center py-2 bg-green-100 rounded border border-green-200">
//                               <span className="text-green-700 font-medium text-sm flex items-center justify-center gap-2">
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                                 </svg>
//                                 Completed
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>

//             {/* Comp Off Requests */}
//             <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
//                   <div className="p-2 bg-red-100 rounded-lg">
//                     <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                   </div>
//                   Compensatory Off
//                   <span className="bg-red-100 text-red-800 text-sm px-2 py-1 rounded-full font-medium">
//                     {dashboardData?.approved_comp_off_requests?.length || 0}
//                   </span>
//                 </h2>
//               </div>
              
//               <div className="space-y-4">
//                 {!dashboardData?.approved_comp_off_requests?.length ? (
//                   <div className="text-center py-8 text-gray-500">
//                     <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
//                       <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                     </div>
//                     <p className="font-medium">No approved Comp Off requests</p>
//                     <p className="text-sm mt-1">Your approved Comp Off requests will appear here</p>
//                   </div>
//                 ) : (
//                   dashboardData.approved_comp_off_requests.filter(req => req.status === 'Approved').map((request) => (
//                     <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
//                       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                         <div className="flex-1">
//                           <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
//                             <h4 className="text-lg font-medium text-gray-900">
//                               {formatDate(request.date)} • {request.hours}h
//                             </h4>
//                             <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium self-start sm:self-center">
//                               Approved
//                             </span>
//                           </div>
                          
//                           <div className="space-y-2 text-sm text-gray-600">
//                             <div className="flex items-center gap-2">
//                               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               Worked: {request.actual_hours_worked || 0}h
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//                               </svg>
//                               Remaining: {Math.max(0, request.hours - (request.actual_hours_worked || 0))}h
//                             </div>
//                           </div>

//                           <p className="text-sm text-gray-700 mt-3 bg-white p-3 rounded border border-gray-200">
//                             {request.reason}
//                           </p>
//                         </div>

//                         <div className="flex flex-col gap-2">
//                           {!activeSession && request.status !== 'Completed' && (
//                             <button
//                               onClick={() => handleStartWork(request, 'comp_off')}
//                               className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
//                             >
//                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                               </svg>
//                               Start Work
//                             </button>
//                           )}

//                           {request.status === 'Completed' && (
//                             <div className="text-center py-2 bg-green-100 rounded border border-green-200">
//                               <span className="text-green-700 font-medium text-sm flex items-center justify-center gap-2">
//                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                                 </svg>
//                                 Completed
//                               </span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Modals */}
//         {showStartModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">Start Work Session</h3>
//                 <p className="text-gray-600 mt-1">Plan your work and set your energy level</p>
//               </div>
              
//               <div className="p-6 space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Work Plan Note *
//                   </label>
//                   <textarea
//                     value={startForm.start_note}
//                     onChange={(e) => setStartForm({ ...startForm, start_note: e.target.value })}
//                     placeholder="Describe your overall work plan for this session..."
//                     className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Tasks Planned *
//                   </label>
//                   <div className="space-y-2">
//                     {startForm.tasks_planned.map((task, index) => (
//                       <div key={index} className="flex gap-2">
//                         <input
//                           type="text"
//                           value={task}
//                           onChange={(e) => updatePlannedTask(index, e.target.value)}
//                           placeholder={`Task ${index + 1}`}
//                           className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                         />
//                         {startForm.tasks_planned.length > 1 && (
//                           <button
//                             onClick={() => removePlannedTask(index)}
//                             className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                           >
//                             ×
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                     <button
//                       onClick={addPlannedTask}
//                       className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                       </svg>
//                       Add Another Task
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Energy Level: {startForm.energy_level}/5
//                   </label>
//                   <input
//                     type="range"
//                     min="1"
//                     max="5"
//                     value={startForm.energy_level}
//                     onChange={(e) => setStartForm({ ...startForm, energy_level: parseInt(e.target.value) })}
//                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>Low</span>
//                     <span>Medium</span>
//                     <span>High</span>
//                   </div>
//                 </div>
                
//                 <div className="flex gap-3 pt-4">
//                   <button
//                     onClick={() => setShowStartModal(false)}
//                     className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={submitStartWork}
//                     className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                     </svg>
//                     Start Working
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {showEndModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">Complete Work Session</h3>
//                 <p className="text-gray-600 mt-1">Provide details about the work you completed</p>
//               </div>
              
//               <div className="p-6 space-y-5">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Work Completed Summary *
//                   </label>
//                   <textarea
//                     value={endForm.work_completed}
//                     onChange={(e) => setEndForm({ ...endForm, work_completed: e.target.value })}
//                     placeholder="Describe what you accomplished during this work session..."
//                     className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Tasks Accomplished
//                   </label>
//                   <div className="space-y-2">
//                     {endForm.tasks_accomplished.map((task, index) => (
//                       <div key={index} className="flex gap-2">
//                         <input
//                           type="text"
//                           value={task}
//                           onChange={(e) => updateTask(index, e.target.value)}
//                           placeholder={`Task ${index + 1}`}
//                           className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                         />
//                         {endForm.tasks_accomplished.length > 1 && (
//                           <button
//                             onClick={() => removeTask(index)}
//                             className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
//                           >
//                             ×
//                           </button>
//                         )}
//                       </div>
//                     ))}
//                     <button
//                       onClick={addTaskField}
//                       className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                       </svg>
//                       Add Another Task
//                     </button>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Challenges Faced (Optional)
//                   </label>
//                   <textarea
//                     value={endForm.challenges_faced}
//                     onChange={(e) => setEndForm({ ...endForm, challenges_faced: e.target.value })}
//                     placeholder="Any challenges or issues you faced during work..."
//                     className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Plan for Next Session (Optional)
//                   </label>
//                   <textarea
//                     value={endForm.next_day_plan}
//                     onChange={(e) => setEndForm({ ...endForm, next_day_plan: e.target.value })}
//                     placeholder="What you plan to work on in your next session..."
//                     className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Focus Quality: {endForm.focus_quality}/5
//                   </label>
//                   <input
//                     type="range"
//                     min="1"
//                     max="5"
//                     value={endForm.focus_quality}
//                     onChange={(e) => setEndForm({ ...endForm, focus_quality: parseInt(e.target.value) })}
//                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
//                   />
//                   <div className="flex justify-between text-xs text-gray-500 mt-1">
//                     <span>Poor</span>
//                     <span>Good</span>
//                     <span>Excellent</span>
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Meetings Attended
//                   </label>
//                   <input
//                     type="number"
//                     min="0"
//                     value={endForm.meetings_attended}
//                     onChange={(e) => setEndForm({ ...endForm, meetings_attended: parseInt(e.target.value) || 0 })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Blockers (Optional)
//                   </label>
//                   <textarea
//                     value={endForm.blockers}
//                     onChange={(e) => setEndForm({ ...endForm, blockers: e.target.value })}
//                     placeholder="Any blockers or obstacles you encountered..."
//                     className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Closing Notes (Optional)
//                   </label>
//                   <textarea
//                     value={endForm.end_note}
//                     onChange={(e) => setEndForm({ ...endForm, end_note: e.target.value })}
//                     placeholder="Any additional notes or comments..."
//                     className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   />
//                 </div>

//                 <div className="flex gap-3 pt-4">
//                   <button
//                     onClick={() => setShowEndModal(false)}
//                     className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={submitEndWork}
//                     className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                     </svg>
//                     Submit Report
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {showNoteModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900">Add Session Note</h3>
//                 <p className="text-gray-600 mt-1">Add a note about your current work</p>
//               </div>
              
//               <div className="p-6">
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Note Type
//                   </label>
//                   <select
//                     value={noteForm.note_type}
//                     onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                   >
//                     <option value="progress">Work Progress</option>
//                     <option value="issue">Issue/Challenge</option>
//                     <option value="achievement">Achievement</option>
//                     <option value="question">Question</option>
//                     <option value="general">General Note</option>
//                   </select>
//                 </div>
                
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Note Content *
//                   </label>
//                   <textarea
//                     value={noteForm.note}
//                     onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
//                     placeholder="Enter your note here..."
//                     className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                     required
//                   />
//                 </div>
                
//                 <div className="flex gap-3">
//                   <button
//                     onClick={() => setShowNoteModal(false)}
//                     className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={submitNote}
//                     className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
//                   >
//                     Add Note
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default EmployeeHome;



import React, { useState, useEffect } from 'react';
import { 
  getEmployeeHomeData, 
  startWorkSessionWithNotes, 
  endWorkSessionWithReport,
  addSessionNote,
  getSessionDetails,
  getOneTimeISTTime,
  getClientISTTime,
  getLeaves
} from '../../api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './EmployeeHome.css';

const EmployeeHome = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [currentTimeIST, setCurrentTimeIST] = useState('');
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sessionNotes, setSessionNotes] = useState([]);
  const [timeSynced, setTimeSynced] = useState(false);
  const [revisionData, setRevisionData] = useState(null);
  const [leaveStats, setLeaveStats] = useState({ total: 18, used: 0, remaining: 18 });
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('wfh');

  // Form states
  const [startForm, setStartForm] = useState({ 
    start_note: '', 
    tasks_planned: [''],
    energy_level: 3
  });
  const [endForm, setEndForm] = useState({
    end_note: '',
    work_completed: '',
    tasks_accomplished: [''],
    challenges_faced: '',
    next_day_plan: '',
    focus_quality: 3,
    meetings_attended: 0,
    blockers: ''
  });
  const [noteForm, setNoteForm] = useState({
    note: '',
    note_type: 'progress'
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await performOneTimeTimeSync();
      await fetchEmployeeHomeData();
      setupLocalISTClock();
    } catch (error) {
      console.error('App initialization error:', error);
    }
  };

  const performOneTimeTimeSync = async () => {
    const lastSync = localStorage.getItem('last_time_sync');
    const shouldSync = !lastSync || (new Date() - new Date(lastSync)) > (30 * 60 * 1000);
    
    if (shouldSync) {
      try {
        await getOneTimeISTTime();
      } catch (error) {
        console.log('Using client time as fallback');
      }
    }
    
    setCurrentTimeIST(getClientISTTime());
  };

  const setupLocalISTClock = () => {
    const interval = setInterval(() => {
      setCurrentTimeIST(getClientISTTime());
      
      if (activeSession) {
        const startTime = activeSession.start_time_ist || activeSession.start_time;
        if (startTime) {
          updateSessionDuration(startTime);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  };

  const fetchEmployeeHomeData = async () => {
    try {
      setLoading(true);
      const data = await getEmployeeHomeData();
      
      if (data.revision_requested) {
        setRevisionData({
          message: data.revision_message,
          incomplete_fields: data.incomplete_fields || []
        });
      } else {
        setRevisionData(null);
      }
      
      setDashboardData(data);
      setActiveSession(data.active_work_session);

      // Load leave stats from leave requests
      try {
        const leaves = await getLeaves()
        const approved = leaves.filter(l => l.status === 'Approved')
        const currentYear = new Date().getFullYear()
        const usedThisYear = approved.filter(l => {
          const leaveYear = new Date(l.start_date || l.date).getFullYear()
          return leaveYear === currentYear
        }).reduce((sum, l) => {
          // count days between start_date and end_date
          if (l.start_date && l.end_date) {
            const start = new Date(l.start_date)
            const end = new Date(l.end_date)
            const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
            return sum + days
          }
          return sum + 1
        }, 0)
        const totalLeaves = 18
        setLeaveStats({ total: totalLeaves, used: usedThisYear, remaining: Math.max(0, totalLeaves - usedThisYear) })
        // Store approved leaves for history display
        const sorted = approved.sort((a, b) => new Date(b.start_date || b.date) - new Date(a.start_date || a.date))
        setLeaveHistory(sorted)
      } catch (e) {
        console.error('Failed to load leave stats:', e)
      }
      
      if (data.active_work_session) {
        fetchSessionNotes(data.active_work_session.id);
        const startTime = data.active_work_session.start_time_ist || data.active_work_session.start_time;
        setupSessionTimer(startTime);
      }
    } catch (error) {
      console.error('Error fetching employee home data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionNotes = async (sessionId) => {
    try {
      const sessionData = await getSessionDetails(sessionId);
      setSessionNotes(sessionData.activity_logs.filter(log => 
        log.activity_type === 'note_added'
      ));
    } catch (error) {
      console.error('Error fetching session notes:', error);
    }
  };

  const updateSessionDuration = (startTime) => {
    if (!startTime) {
      setSessionDuration('00:00:00');
      return;
    }

    try {
      let start;
      
      if (typeof startTime === 'string') {
        const cleanTime = startTime.replace(' IST', '').trim();
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
      
      const now = new Date();
      
      if (isNaN(start.getTime()) || isNaN(now.getTime())) {
        setSessionDuration('00:00:00');
        return;
      }
      
      const diffMs = now - start;
      
      if (diffMs < 0) {
        setSessionDuration('00:00:00');
        return;
      }
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setSessionDuration(duration);
    } catch (error) {
      console.error('Error calculating session duration:', error);
      setSessionDuration('00:00:00');
    }
  };

  const setupSessionTimer = (startTime) => {
    const updateTimer = () => {
      updateSessionDuration(startTime);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  };

  const formatTimeIST = (dateString) => {
    if (!dateString) return '';
    
    try {
      if (dateString.includes('IST')) {
        return dateString;
      }
      
      const date = new Date(dateString);
      return getClientISTTime(date);
    } catch (error) {
      return dateString || 'Invalid Date';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const manualRefreshTime = async () => {
    try {
      toast.loading('Refreshing time with server...');
      const response = await getOneTimeISTTime();
      setCurrentTimeIST(response.data.current_ist_time);
      setTimeSynced(true);
      toast.success('Time refreshed successfully!');
    } catch (error) {
      toast.error('Failed to refresh time');
    }
  };

  const handleStartWork = (request, sessionType) => {
    setSelectedRequest({ ...request, sessionType });
    setShowStartModal(true);
  };

  const submitStartWork = async () => {
    try {
      if (!startForm.start_note.trim()) {
        toast.error('Please add a start note describing your work plan');
        return;
      }

      const tasksPlanned = startForm.tasks_planned.filter(t => t.trim());
      if (tasksPlanned.length === 0) {
        toast.error('Please add at least one task you plan to work on');
        return;
      }

      const response = await startWorkSessionWithNotes(
        selectedRequest.sessionType,
        selectedRequest.id,
        startForm.start_note,
        tasksPlanned,
        startForm.energy_level
      );

      setActiveSession(response.data.session);
      toast.success('Work session started successfully!');
      fetchEmployeeHomeData();
    } catch (error) {
      console.error('Error starting work:', error);
      toast.error(error.response?.data?.error || 'Failed to start work session');
    } finally {
      setShowStartModal(false);
      setStartForm({ start_note: '', tasks_planned: [''], energy_level: 3 });
    }
  };

  const handleEndWork = () => {
    setShowEndModal(true);
  };

  const submitEndWork = async () => {
    try {
      if (!endForm.work_completed.trim()) {
        toast.error('Please describe the work you completed');
        return;
      }

      await endWorkSessionWithReport(activeSession.id, endForm);
      await fetchEmployeeHomeData();

      setActiveSession(null);
      setShowEndModal(false);
      setEndForm({
        end_note: '',
        work_completed: '',
        tasks_accomplished: [''],
        challenges_faced: '',
        next_day_plan: '',
        focus_quality: 3,
        meetings_attended: 0,
        blockers: ''
      });
      setSessionDuration('00:00:00');
      
      toast.success('Work session completed successfully!');
    } catch (error) {
      console.error('Error ending work:', error);
      toast.error(error.response?.data?.error || 'Failed to end work session');
    }
  };

  const submitNote = async () => {
    try {
      if (!noteForm.note.trim()) {
        toast.error('Please enter your note');
        return;
      }

      await addSessionNote(activeSession.id, noteForm);
      setNoteForm({ note: '', note_type: 'progress' });
      setShowNoteModal(false);
      
      toast.success('Note added successfully!');
      fetchSessionNotes(activeSession.id);
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const addTaskField = () => {
    setEndForm({
      ...endForm,
      tasks_accomplished: [...endForm.tasks_accomplished, '']
    });
  };

  const updateTask = (index, value) => {
    const updatedTasks = [...endForm.tasks_accomplished];
    updatedTasks[index] = value;
    setEndForm({
      ...endForm,
      tasks_accomplished: updatedTasks
    });
  };

  const removeTask = (index) => {
    const updatedTasks = endForm.tasks_accomplished.filter((_, i) => i !== index);
    setEndForm({
      ...endForm,
      tasks_accomplished: updatedTasks
    });
  };

  const addPlannedTask = () => {
    setStartForm({
      ...startForm,
      tasks_planned: [...startForm.tasks_planned, '']
    });
  };

  const updatePlannedTask = (index, value) => {
    const updatedTasks = [...startForm.tasks_planned];
    updatedTasks[index] = value;
    setStartForm({
      ...startForm,
      tasks_planned: updatedTasks
    });
  };

  const removePlannedTask = (index) => {
    const updatedTasks = startForm.tasks_planned.filter((_, i) => i !== index);
    setStartForm({
      ...startForm,
      tasks_planned: updatedTasks
    });
  };

  if (loading) {
    return (
    <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-300 border-t-gray-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Revision Request Banner */}
        {revisionData && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 rounded-r-md p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-amber-800">{revisionData.message}</p>
                <button
                  onClick={() => navigate('/employee-form')}
                  className="text-sm text-amber-700 font-medium hover:text-amber-900 mt-2"
                >
                  Complete Profile →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {dashboardData?.employee?.first_name}</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your work sessions and track progress</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-gray-400 uppercase tracking-wide">IST</div>
                <div className="text-xl font-mono text-gray-700 font-medium">{currentTimeIST}</div>
              </div>
              <button
                onClick={manualRefreshTime}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                title="Sync time"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Active Session Banner */}
        {activeSession && (
          <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-medium text-gray-800">Active Work Session</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {activeSession.session_type?.toUpperCase()} • Started at {formatTimeIST(activeSession.start_time_ist || activeSession.start_time)}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-mono font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-md">
                    {sessionDuration}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">elapsed</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNoteModal(true)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Add Note
                  </button>
                  <button
                    onClick={handleEndWork}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    End Session
                  </button>
                </div>
              </div>
            </div>

            {/* Session Notes Preview */}
            {sessionNotes.length > 0 && (
              <div className="px-6 py-4 bg-gray-50/50">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Recent Notes
                </h4>
                <div className="space-y-2">
                  {sessionNotes.slice(0, 3).map((note, index) => (
                    <div key={index} className="text-sm text-gray-600 border-l-2 border-gray-300 pl-3 py-1">
                      <p>{note.note}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimeIST(note.timestamp_ist || note.timestamp)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards - Clean horizontal layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-800">{dashboardData?.comp_off_balance || 0}h</div>
            <div className="text-xs text-gray-500 mt-1">Comp Off Balance</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-800">
              {(dashboardData?.approved_wfh_requests?.length || 0) + (dashboardData?.approved_comp_off_requests?.length || 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">Approved Requests</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-semibold text-gray-800">
              {dashboardData?.today_attendance ? '✓' : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Today's Status</div>
          </div>
          <div 
            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
            onClick={() => window.dispatchEvent(new CustomEvent('open-doc-drawer', { detail: 'salary' }))}
          >
            <div className="text-2xl font-semibold text-gray-800 flex items-center justify-between">
              ₹
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 mt-1">Salary Slips</div>
          </div>
        </div>

        {/* Leave Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Leave Balance</h3>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-semibold text-gray-800">{leaveStats.remaining}</span>
                <span className="text-sm text-gray-400">/ {leaveStats.total} days</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used {leaveStats.used} days this year</p>
            </div>
            {leaveHistory.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-1">Recent leaves</p>
                <div className="flex flex-wrap gap-3">
                  {leaveHistory.slice(0, 3).map((leave) => {
                    const start = new Date(leave.start_date || leave.date)
                    const end = leave.end_date ? new Date(leave.end_date) : start
                    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1
                    return (
                      <span key={leave.id} className="text-xs text-gray-600">
                        {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {days > 1 && ` - ${end.getDate()}`} ({days}d)
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('wfh')}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === 'wfh'
                  ? 'text-gray-800 border-b-2 border-gray-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Work From Home
              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {dashboardData?.approved_wfh_requests?.length || 0}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('comp_off')}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === 'comp_off'
                  ? 'text-gray-800 border-b-2 border-gray-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Compensatory Off
              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {dashboardData?.approved_comp_off_requests?.length || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content - WFH */}
        {activeTab === 'wfh' && (
          <div className="space-y-3">
            {!dashboardData?.approved_wfh_requests?.length ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-sm">No approved WFH requests</p>
                <p className="text-xs text-gray-300 mt-1">Approved requests will appear here</p>
              </div>
            ) : (
              dashboardData.approved_wfh_requests.filter(req => req.status === 'Approved').map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-800">{request.type}</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Approved</span>
                        <span className="text-xs text-gray-400">{formatDate(request.start_date)} - {formatDate(request.end_date)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Expected: {request.expected_hours}h</span>
                        <span>Worked: {request.actual_hours || 0}h</span>
                      </div>
                    </div>
                    <div>
                      {!activeSession && request.status !== 'Completed' && (
                        <button
                          onClick={() => handleStartWork(request, 'wfh')}
                          className="px-4 py-2 text-sm text-white bg-gray-800 hover:bg-gray-900 rounded-md transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Start Work
                        </button>
                      )}
                      {request.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content - Comp Off */}
        {activeTab === 'comp_off' && (
          <div className="space-y-3">
            {!dashboardData?.approved_comp_off_requests?.length ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-400 text-sm">No approved Comp Off requests</p>
                <p className="text-xs text-gray-300 mt-1">Approved requests will appear here</p>
              </div>
            ) : (
              dashboardData.approved_comp_off_requests.filter(req => req.status === 'Approved').map((request) => (
                <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-800">{formatDate(request.date)}</span>
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Approved</span>
                        <span className="text-xs text-gray-400">{request.hours} hours</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Worked: {request.actual_hours_worked || 0}h</span>
                        <span>Remaining: {Math.max(0, request.hours - (request.actual_hours_worked || 0))}h</span>
                      </div>
                    </div>
                    <div>
                      {!activeSession && request.status !== 'Completed' && (
                        <button
                          onClick={() => handleStartWork(request, 'comp_off')}
                          className="px-4 py-2 text-sm text-white bg-gray-800 hover:bg-gray-900 rounded-md transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Start Work
                        </button>
                      )}
                      {request.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Start Work Modal */}
        {showStartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Start Work Session</h3>
                <p className="text-gray-500 text-sm mt-1">Plan your work for this session</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Plan Note *</label>
                  <textarea
                    value={startForm.start_note}
                    onChange={(e) => setStartForm({ ...startForm, start_note: e.target.value })}
                    placeholder="Describe your overall work plan..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Planned *</label>
                  <div className="space-y-2">
                    {startForm.tasks_planned.map((task, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={task}
                          onChange={(e) => updatePlannedTask(index, e.target.value)}
                          placeholder={`Task ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400"
                        />
                        {startForm.tasks_planned.length > 1 && (
                          <button onClick={() => removePlannedTask(index)} className="px-3 text-gray-400 hover:text-red-500">✕</button>
                        )}
                      </div>
                    ))}
                    <button onClick={addPlannedTask} className="text-sm text-gray-500 hover:text-gray-700">+ Add task</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level: {startForm.energy_level}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={startForm.energy_level}
                    onChange={(e) => setStartForm({ ...startForm, energy_level: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowStartModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={submitStartWork} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900">Start Session</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* End Work Modal */}
        {showEndModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Complete Work Session</h3>
                <p className="text-gray-500 text-sm mt-1">Provide details about the work you completed</p>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Completed Summary *</label>
                  <textarea
                    value={endForm.work_completed}
                    onChange={(e) => setEndForm({ ...endForm, work_completed: e.target.value })}
                    placeholder="Describe what you accomplished..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tasks Accomplished</label>
                  {endForm.tasks_accomplished.map((task, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" value={task} onChange={(e) => updateTask(idx, e.target.value)} placeholder={`Task ${idx+1}`} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                      {endForm.tasks_accomplished.length > 1 && <button onClick={() => removeTask(idx)} className="text-gray-400 hover:text-red-500">✕</button>}
                    </div>
                  ))}
                  <button onClick={addTaskField} className="text-sm text-gray-500 hover:text-gray-700">+ Add task</button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Challenges Faced</label>
                  <textarea value={endForm.challenges_faced} onChange={(e) => setEndForm({ ...endForm, challenges_faced: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Any challenges..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Focus Quality: {endForm.focus_quality}/5</label>
                  <input type="range" min="1" max="5" value={endForm.focus_quality} onChange={(e) => setEndForm({ ...endForm, focus_quality: parseInt(e.target.value) })} className="w-full" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setShowEndModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={submitEndWork} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900">Submit Report</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Add Note</h3>
                <p className="text-gray-500 text-sm mt-1">Add a note about your current work</p>
              </div>
              <div className="p-5 space-y-4">
                <select value={noteForm.note_type} onChange={(e) => setNoteForm({ ...noteForm, note_type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="progress">Work Progress</option>
                  <option value="issue">Issue/Challenge</option>
                  <option value="achievement">Achievement</option>
                  <option value="question">Question</option>
                  <option value="general">General Note</option>
                </select>
                <textarea value={noteForm.note} onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })} placeholder="Enter your note here..." rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <div className="flex gap-3">
                  <button onClick={() => setShowNoteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={submitNote} className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900">Add Note</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeHome;