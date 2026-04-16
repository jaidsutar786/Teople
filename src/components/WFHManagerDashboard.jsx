// import React, { useState, useEffect } from "react";
// import { 
//   getWFHRequests, 
//   updateWFHRequest, 
//   exportWFHCSV, 
//   exportWFHPDF,
//   getCompOffRequests,
//   updateCompOffRequest,
//   exportCompOffCSV,
//   exportCompOffPDF,
//   getLeaves,
//   updateLeaveStatus,
//   exportLeavesCSV,
//   exportLeavesPDF
// } from "../api";
// import { toast } from "react-hot-toast";

// const ManagerDashboard = () => {
//   const [wfhRequests, setWfhRequests] = useState([]);
//   const [compOffRequests, setCompOffRequests] = useState([]);
//   const [leaves, setLeaves] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [activeTab, setActiveTab] = useState("wfh");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const fetchAllRequests = async () => {
//     setLoading(true);
//     try {
//       const [wfhData, compOffData, leavesData] = await Promise.all([
//         getWFHRequests(),
//         getCompOffRequests(),
//         getLeaves()
//       ]);
//       setWfhRequests(wfhData);
//       setCompOffRequests(compOffData);
//       setLeaves(leavesData);
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to fetch requests");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllRequests();
//   }, []);

//   // WFH Actions
//   const handleWFHAction = async (id, action) => {
//     try {
//       await updateWFHRequest(id, { status: action });
//       toast.success(`WFH Request ${action}`);
//       fetchAllRequests();
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to update WFH request");
//     }
//   };

//   // Comp Off Actions
//   const handleCompOffAction = async (id, action) => {
//     try {
//       await updateCompOffRequest(id, { status: action });
//       toast.success(`Comp Off Request ${action}`);
//       fetchAllRequests();
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to update Comp Off request");
//     }
//   };

//   // Leave Actions - FIXED: Correct function name
//   const handleLeaveAction = async (id, action) => {
//     try {
//       await updateLeaveStatus(id, action);
//       toast.success(`Leave Request ${action}`);
//       fetchAllRequests();
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to update leave request");
//     }
//   };

//   // Filter requests based on search
//   const filteredWFHRequests = wfhRequests.filter(
//     (r) =>
//       r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
//       r.reason?.toLowerCase().includes(search.toLowerCase()) ||
//       r.type?.toLowerCase().includes(search.toLowerCase())
//   );

//   const filteredCompOffRequests = compOffRequests.filter(
//     (r) =>
//       r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
//       r.reason?.toLowerCase().includes(search.toLowerCase()) ||
//       r.hours?.toString().includes(search)
//   );

//   const filteredLeaves = leaves.filter(
//     (l) =>
//       l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
//       l.reason?.toLowerCase().includes(search.toLowerCase()) ||
//       l.leave_type?.toLowerCase().includes(search.toLowerCase()) ||
//       l.status?.toLowerCase().includes(search.toLowerCase())
//   );

//   // Get current requests based on active tab
//   const getCurrentRequests = () => {
//     switch (activeTab) {
//       case "wfh": return filteredWFHRequests;
//       case "compoff": return filteredCompOffRequests;
//       case "leaves": return filteredLeaves;
//       default: return [];
//     }
//   };

//   const currentRequests = getCurrentRequests();
//   const indexOfLast = currentPage * itemsPerPage;
//   const indexOfFirst = indexOfLast - itemsPerPage;
//   const currentDisplayRequests = currentRequests.slice(indexOfFirst, indexOfLast);
//   const totalPages = Math.ceil(currentRequests.length / itemsPerPage);

//   // Reset to page 1 when tab changes
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [activeTab]);

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     return new Date(dateStr).toLocaleDateString("en-US");
//   };

//   const getStatusBadge = (status) => {
//     const baseClasses = "px-3 py-1 text-xs font-medium rounded-full border";
    
//     switch (status) {
//       case "Pending":
//         return `${baseClasses} bg-yellow-100 text-yellow-700 border-yellow-200`;
//       case "Approved":
//         return `${baseClasses} bg-green-100 text-green-700 border-green-200`;
//       case "Rejected":
//         return `${baseClasses} bg-red-100 text-red-700 border-red-200`;
//       default:
//         return `${baseClasses} bg-gray-100 text-gray-700 border-gray-200`;
//     }
//   };

//   const getTypeBadge = (item) => {
//     const baseClasses = "px-3 py-1 text-xs font-medium rounded-full border";
    
//     switch (activeTab) {
//       case "wfh":
//         return item.type === "Half Day" 
//           ? `${baseClasses} bg-orange-100 text-orange-700 border-orange-200`
//           : `${baseClasses} bg-blue-100 text-blue-700 border-blue-200`;
      
//       case "compoff":
//         if (item.hours >= 8) return `${baseClasses} bg-purple-100 text-purple-700 border-purple-200`;
//         if (item.hours >= 4) return `${baseClasses} bg-blue-100 text-blue-700 border-blue-200`;
//         return `${baseClasses} bg-green-100 text-green-700 border-green-200`;
      
//       case "leaves":
//         switch (item.leave_type) {
//           case "sick": return `${baseClasses} bg-red-100 text-red-700 border-red-200`;
//           case "casual": return `${baseClasses} bg-blue-100 text-blue-700 border-blue-200`;
//           case "paid": return `${baseClasses} bg-green-100 text-green-700 border-green-200`;
//           case "unpaid": return `${baseClasses} bg-gray-100 text-gray-700 border-gray-200`;
//           default: return `${baseClasses} bg-gray-100 text-gray-700 border-gray-200`;
//         }
      
//       default:
//         return `${baseClasses} bg-gray-100 text-gray-700 border-gray-200`;
//     }
//   };

//   const getExportFunctions = () => {
//     switch (activeTab) {
//       case "wfh": return { csv: exportWFHCSV, pdf: exportWFHPDF };
//       case "compoff": return { csv: exportCompOffCSV, pdf: exportCompOffPDF };
//       case "leaves": return { csv: exportLeavesCSV, pdf: exportLeavesPDF };
//       default: return { csv: () => {}, pdf: () => {} };
//     }
//   };

//   const { csv: exportCSV, pdf: exportPDF } = getExportFunctions();

//   const handleExportCSV = async () => {
//     try {
//       await exportCSV();
//       toast.success("CSV exported successfully!");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to export CSV");
//     }
//   };

//   const handleExportPDF = async () => {
//     try {
//       await exportPDF();
//       toast.success("PDF exported successfully!");
//     } catch (err) {
//       console.error(err);
//       toast.error("Failed to export PDF");
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold text-gray-800 mb-6">Manager Dashboard</h1>

//       <div className="bg-white rounded-xl shadow-lg">
//         <div className="p-6">
//           {/* Tabs */}
//           <div className="flex border-b border-gray-200 mb-6">
//             <button
//               className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
//                 activeTab === "wfh"
//                   ? "border-blue-500 text-blue-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//               onClick={() => setActiveTab("wfh")}
//             >
//               🏠 WFH Requests ({filteredWFHRequests.length})
//             </button>
//             <button
//               className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
//                 activeTab === "compoff"
//                   ? "border-purple-500 text-purple-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//               onClick={() => setActiveTab("compoff")}
//             >
//               ⏰ Comp Off Requests ({filteredCompOffRequests.length})
//             </button>
//             <button
//               className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
//                 activeTab === "leaves"
//                   ? "border-green-500 text-green-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//               onClick={() => setActiveTab("leaves")}
//             >
//               🍃 Leave Requests ({filteredLeaves.length})
//             </button>
//           </div>

//           <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
//             {activeTab === "wfh" && (
//               <>
//                 <svg className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//                 </svg>
//                 WFH Requests
//               </>
//             )}
//             {activeTab === "compoff" && (
//               <>
//                 <svg className="h-6 w-6 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Comp Off Requests
//               </>
//             )}
//             {activeTab === "leaves" && (
//               <>
//                 <svg className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//                 Leave Requests
//               </>
//             )}
//           </h2>

//           {/* Search and Export */}
//           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
//             <input
//               type="text"
//               placeholder={`Search ${activeTab} requests...`}
//               className="flex-1 px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               value={search}
//               onChange={(e) => {
//                 setSearch(e.target.value);
//                 setCurrentPage(1);
//               }}
//             />
//             <div className="flex space-x-3">
//               <button
//                 onClick={handleExportCSV}
//                 className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
//               >
//                 Export CSV
//               </button>
//               <button
//                 onClick={handleExportPDF}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
//               >
//                 Export PDF
//               </button>
//             </div>
//           </div>

//           {loading ? (
//             <div className="flex justify-center items-center py-12">
//               <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
//               <span className="ml-3 text-gray-600">Loading requests...</span>
//             </div>
//           ) : currentDisplayRequests.length === 0 ? (
//             <div className="text-center py-12">
//               <div className="text-gray-400 text-6xl mb-4">
//                 {activeTab === "wfh" ? "🏠" : activeTab === "compoff" ? "⏰" : "🍃"}
//               </div>
//               <p className="text-gray-500 text-lg">
//                 No {activeTab} requests found.
//               </p>
//               <p className="text-gray-400 text-sm mt-2">
//                 {search ? "Try adjusting your search criteria." : "No requests available."}
//               </p>
//             </div>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm text-left text-gray-700">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="px-6 py-3 font-semibold">Employee</th>
//                     {activeTab === "wfh" && <th className="px-6 py-3 font-semibold">Dates</th>}
//                     {activeTab === "compoff" && <th className="px-6 py-3 font-semibold">Date & Hours</th>}
//                     {activeTab === "leaves" && <th className="px-6 py-3 font-semibold">Dates</th>}
//                     <th className="px-6 py-3 font-semibold">Reason</th>
//                     <th className="px-6 py-3 font-semibold">Type</th>
//                     <th className="px-6 py-3 font-semibold">Status</th>
//                     <th className="px-6 py-3 font-semibold">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {currentDisplayRequests.map((item) => (
//                     <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4 font-medium">
//                         {activeTab === "leaves" ? item.full_name : item.employee_name}
//                       </td>
                      
//                       {/* Dates Column */}
//                       {activeTab === "wfh" && (
//                         <td className="px-6 py-4">
//                           {item.start_date && item.end_date
//                             ? `${formatDate(item.start_date)} → ${formatDate(item.end_date)}`
//                             : "—"}
//                         </td>
//                       )}
                      
//                       {activeTab === "compoff" && (
//                         <td className="px-6 py-4">
//                           <div className="font-medium">{formatDate(item.date)}</div>
//                           <div className="text-sm text-gray-500">{item.hours} hours</div>
//                         </td>
//                       )}
                      
//                       {activeTab === "leaves" && (
//                         <td className="px-6 py-4">
//                           {item.start_date && item.end_date
//                             ? `${formatDate(item.start_date)} → ${formatDate(item.end_date)}`
//                             : "—"}
//                         </td>
//                       )}
                      
//                       <td className="px-6 py-4 max-w-xs">
//                         <div title={item.reason}>
//                           {item.reason.length > 100 ? `${item.reason.substring(0, 100)}...` : item.reason}
//                         </div>
//                       </td>
                      
//                       {/* Type Column */}
//                       <td className="px-6 py-4">
//                         <span className={getTypeBadge(item)}>
//                           {activeTab === "leaves" 
//                             ? item.leave_type?.charAt(0).toUpperCase() + item.leave_type?.slice(1) + " Leave"
//                             : activeTab === "compoff"
//                             ? `${item.hours} hours`
//                             : item.type
//                           }
//                         </span>
//                       </td>
                      
//                       {/* Status Column */}
//                       <td className="px-6 py-4">
//                         <span className={getStatusBadge(item.status)}>
//                           {item.status}
//                         </span>
//                       </td>
                      
//                       {/* Action Column */}
//                       <td className="px-6 py-4">
//                         {item.status === "Pending" ? (
//                           <div className="flex space-x-2">
//                             <button
//                               onClick={() => {
//                                 switch (activeTab) {
//                                   case "wfh": return handleWFHAction(item.id, "Approved");
//                                   case "compoff": return handleCompOffAction(item.id, "Approved");
//                                   case "leaves": return handleLeaveAction(item.id, "Approved");
//                                   default: return null;
//                                 }
//                               }}
//                               className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
//                             >
//                               Approve
//                             </button>
//                             <button
//                               onClick={() => {
//                                 switch (activeTab) {
//                                   case "wfh": return handleWFHAction(item.id, "Rejected");
//                                   case "compoff": return handleCompOffAction(item.id, "Rejected");
//                                   case "leaves": return handleLeaveAction(item.id, "Rejected");
//                                   default: return null;
//                                 }
//                               }}
//                               className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
//                             >
//                               Reject
//                             </button>
//                           </div>
//                         ) : (
//                           <span className="text-gray-400 text-sm">Action taken</span>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               {/* Pagination */}
//               <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-6 py-3 border-t">
//                 <div className="text-sm text-gray-600 mb-2 sm:mb-0">
//                   Showing {indexOfFirst + 1} to {Math.min(indexOfLast, currentRequests.length)} of {currentRequests.length} entries
//                 </div>
//                 <div className="flex space-x-2">
//                   <button
//                     disabled={currentPage === 1}
//                     onClick={() => setCurrentPage((prev) => prev - 1)}
//                     className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
//                   >
//                     Previous
//                   </button>
//                   <span className="px-4 py-2 text-sm font-medium text-gray-700">
//                     Page {currentPage} of {totalPages}
//                   </span>
//                   <button
//                     disabled={currentPage === totalPages}
//                     onClick={() => setCurrentPage((prev) => prev + 1)}
//                     className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
//                   >
//                     Next
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ManagerDashboard;





"use client"

import { useState, useEffect, useRef } from "react"
import {
  getWFHRequests,
  updateWFHRequest,
  exportWFHCSV,
  exportWFHPDF,
  getCompOffRequests,
  updateCompOffRequest,
  exportCompOffCSV,
  exportCompOffPDF,
  getLeaves,
  updateLeaveStatus,
  exportLeavesCSV,
  exportLeavesPDF,
} from "../api"
import { toast } from "react-hot-toast"
import {
  HomeIcon,
  ClockIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline"
import { Button } from "antd"
import { useRequestsWebSocket } from '../hooks/useRequestsWebSocket'

const ManagerDashboard = ({ activeTab: initialTab }) => {
  const [wfhRequests, setWfhRequests] = useState([])
  const [compOffRequests, setCompOffRequests] = useState([])
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState(initialTab || "wfh")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [rejectModal, setRejectModal] = useState({ open: false, item: null })
  const [rejectReason, setRejectReason] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // activeTab ref - WebSocket callback mein latest value milegi
  const activeTabRef = useRef(initialTab || "wfh")
  activeTabRef.current = activeTab

  const fetchWFHRef = useRef(null)
  const fetchCompOffRef = useRef(null)
  const fetchLeavesRef = useRef(null)

  const fetchingRef = useRef(false)  // duplicate fetch rokne ke liye

  fetchWFHRef.current = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try { const data = await getWFHRequests(); setWfhRequests(data) }
    finally { setLoading(false); fetchingRef.current = false }
  }
  fetchCompOffRef.current = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try { const data = await getCompOffRequests(); setCompOffRequests(data) }
    finally { setLoading(false); fetchingRef.current = false }
  }
  fetchLeavesRef.current = async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try { const data = await getLeaves(); setLeaves(data) }
    finally { setLoading(false); fetchingRef.current = false }
  }

  // prevInitialTab null se initialize karo taaki pehli baar hamesha fetch ho
  const prevInitialTab = useRef(null)
  useEffect(() => {
    const tab = initialTab || "wfh"
    if (prevInitialTab.current === tab && activeTab === tab) return  // duplicate call rokna
    prevInitialTab.current = tab
    setActiveTab(tab)
    activeTabRef.current = tab
    if (tab === "wfh") fetchWFHRef.current()
    else if (tab === "compoff") fetchCompOffRef.current()
    else if (tab === "leaves") fetchLeavesRef.current()
  }, [initialTab])

  // WebSocket - naya request aane par sirf matching tab refresh karo
  useRequestsWebSocket((msg) => {
    if (msg.type === "request_update") {
      const reqType = msg.data?.request_type  // 'leave', 'wfh', 'comp_off'
      const tab = activeTabRef.current
      // Sirf tab refresh karo agar request type match kare
      if (reqType === 'wfh' && tab === 'wfh') fetchWFHRef.current()
      else if (reqType === 'comp_off' && tab === 'compoff') fetchCompOffRef.current()
      else if (reqType === 'leave' && tab === 'leaves') fetchLeavesRef.current()
    }
  })

  // WFH Actions - sirf wfh-requests/ call
  const handleWFHAction = async (id, action, reason = "") => {
    try {
      await updateWFHRequest(id, { status: action, rejection_reason: reason })
      toast.success(`WFH Request ${action}`)
      fetchWFHRef.current()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update WFH request")
    }
  }

  // Comp Off Actions - sirf comp-off-requests/ call
  const handleCompOffAction = async (id, action, reason = "") => {
    try {
      await updateCompOffRequest(id, { status: action, rejection_reason: reason })
      toast.success(`Comp Off Request ${action}`)
      fetchCompOffRef.current()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update Comp Off request")
    }
  }

  // Leave Actions - sirf leaves/ call
  const handleLeaveAction = async (id, action, reason = "") => {
    try {
      await updateLeaveStatus(id, action, reason)
      toast.success(`Leave Request ${action}`)
      fetchLeavesRef.current()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update leave request")
    }
  }

  const handleRejectClick = (item) => {
    setRejectReason("")
    setRejectModal({ open: true, item })
  }

  const handleRejectSubmit = async () => {
    const { item } = rejectModal
    if (activeTab === "wfh") await handleWFHAction(item.id, "Rejected", rejectReason)
    else if (activeTab === "compoff") await handleCompOffAction(item.id, "Rejected", rejectReason)
    else await handleLeaveAction(item.id, "Rejected", rejectReason)
    setRejectModal({ open: false, item: null })
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  // Filter requests based on search
  const filteredWFHRequests = wfhRequests.filter(
    (r) =>
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.type?.toLowerCase().includes(search.toLowerCase()),
  )

  const filteredCompOffRequests = compOffRequests.filter(
    (r) =>
      r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.reason?.toLowerCase().includes(search.toLowerCase()) ||
      r.hours?.toString().includes(search),
  )

  const filteredLeaves = leaves.filter(
    (l) =>
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.reason?.toLowerCase().includes(search.toLowerCase()) ||
      l.leave_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.status?.toLowerCase().includes(search.toLowerCase()),
  )

  // Get current requests based on active tab
  const getCurrentRequests = () => {
    switch (activeTab) {
      case "wfh":
        return filteredWFHRequests
      case "compoff":
        return filteredCompOffRequests
      case "leaves":
        return filteredLeaves
      default:
        return []
    }
  }

  const currentRequests = getCurrentRequests()
  const indexOfLast = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentDisplayRequests = currentRequests.slice(indexOfFirst, indexOfLast)
  const totalPages = Math.ceil(currentRequests.length / itemsPerPage)

  // Tab change hone par page 1 par reset karo
  useEffect(() => { setCurrentPage(1) }, [activeTab])

  const formatDate = (dateStr) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("en-US")
  }

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"

    switch (status) {
      case "Pending":
        return `${baseClasses} bg-amber-100 text-amber-700`
      case "Approved":
        return `${baseClasses} bg-emerald-100 text-emerald-700`
      case "Rejected":
        return `${baseClasses} bg-rose-100 text-rose-700`
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  const getTypeBadge = (item) => {
    const baseClasses = "inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"

    switch (activeTab) {
      case "wfh":
        return item.type === "Half Day"
          ? `${baseClasses} bg-orange-100 text-orange-700`
          : `${baseClasses} bg-blue-100 text-blue-700`

      case "compoff":
        if (item.hours >= 8) return `${baseClasses} bg-purple-100 text-purple-700`
        if (item.hours >= 4) return `${baseClasses} bg-blue-100 text-blue-700`
        return `${baseClasses} bg-teal-100 text-teal-700`

      case "leaves":
        switch (item.leave_type) {
          case "sick":
            return `${baseClasses} bg-red-100 text-red-700`
          case "casual":
            return `${baseClasses} bg-blue-100 text-blue-700`
          case "paid":
            return `${baseClasses} bg-green-100 text-green-700`
          case "unpaid":
            return `${baseClasses} bg-gray-100 text-gray-700`
          default:
            return `${baseClasses} bg-gray-100 text-gray-700`
        }

      default:
        return `${baseClasses} bg-gray-100 text-gray-700`
    }
  }

  const getExportFunctions = () => {
    switch (activeTab) {
      case "wfh":
        return { csv: exportWFHCSV, pdf: exportWFHPDF }
      case "compoff":
        return { csv: exportCompOffCSV, pdf: exportCompOffPDF }
      case "leaves":
        return { csv: exportLeavesCSV, pdf: exportLeavesPDF }
      default:
        return { csv: () => {}, pdf: () => {} }
    }
  }

  const { csv: exportCSV, pdf: exportPDF } = getExportFunctions()

  const handleExportCSV = async () => {
    try {
      await exportCSV()
      toast.success("CSV exported successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export CSV")
    }
  }

  const handleExportPDF = async () => {
    try {
      await exportPDF()
      toast.success("PDF exported successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export PDF")
    }
  }

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === "wfh" ? "WFH" : activeTab === "compoff" ? "Comp Off" : "Leave"} requests...`}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="primary" size="middle" icon={<ArrowDownTrayIcon className="w-4 h-4" />} onClick={handleExportCSV} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>CSV</Button>
          <Button type="primary" size="middle" icon={<ArrowDownTrayIcon className="w-4 h-4" />} onClick={handleExportPDF}>PDF</Button>
        </div>
      </div>

        <div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : currentDisplayRequests.length === 0 ? (
            <div className="text-center py-20 text-gray-500 text-sm">No requests found</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Emp ID</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Employee</th>
                    {activeTab === "wfh" && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Dates</th>}
                    {activeTab === "compoff" && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Date & Hours</th>}
                    {activeTab === "leaves" && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Dates</th>}
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Reason</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wide border border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentDisplayRequests.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors bg-white border-b border-gray-100">
                      <td className="px-4 py-3 text-center border border-gray-100">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.employee_id || "—"}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 text-center border border-gray-100">{activeTab === "leaves" ? item.full_name : item.employee_name}</td>

                      {activeTab === "wfh" && (
                        <td className="px-4 py-3 text-gray-700 text-center border border-gray-100">{item.start_date && item.end_date ? `${formatDate(item.start_date)} → ${formatDate(item.end_date)}` : "—"}</td>
                      )}
                      {activeTab === "compoff" && (
                        <td className="px-4 py-3 text-center border border-gray-100">
                          <div className="font-medium text-gray-900">{formatDate(item.date)}</div>
                          <div className="text-xs text-gray-500">{item.hours} hours</div>
                        </td>
                      )}
                      {activeTab === "leaves" && (
                        <td className="px-4 py-3 text-gray-700 text-center border border-gray-100">{item.start_date && item.end_date ? `${formatDate(item.start_date)} → ${formatDate(item.end_date)}` : "—"}</td>
                      )}

                      <td className="px-4 py-3 max-w-xs text-gray-700 text-center border border-gray-100">
                        <div title={item.reason} className="truncate">{item.reason?.length > 40 ? `${item.reason.substring(0, 40)}...` : item.reason}</div>
                      </td>
                      <td className="px-4 py-3 text-center border border-gray-100">
                        <span className={getTypeBadge(item)}>
                          {activeTab === "leaves" ? item.leave_type?.charAt(0).toUpperCase() + item.leave_type?.slice(1) + " Leave" : activeTab === "compoff" ? `${item.hours} hours` : item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center border border-gray-100"><span className={getStatusBadge(item.status)}>{item.status}</span></td>
                      <td className="px-4 py-3 text-center border border-gray-100">
                        {item.status === "Pending" ? (
                          <div className="flex gap-1.5 justify-center">
                            <Button type="primary" size="middle" icon={<CheckCircleIcon className="w-4 h-4" />} onClick={() => { activeTab === "wfh" ? handleWFHAction(item.id, "Approved") : activeTab === "compoff" ? handleCompOffAction(item.id, "Approved") : handleLeaveAction(item.id, "Approved") }} style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}>
                              Approve
                            </Button>
                            <Button type="primary" size="middle" icon={<XCircleIcon className="w-4 h-4" />} onClick={() => handleRejectClick(item)} danger>
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Action taken</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-white">
                <div className="text-xs text-gray-500">Showing {indexOfFirst + 1} to {Math.min(indexOfLast, currentRequests.length)} of {currentRequests.length} entries</div>
                <div className="flex items-center gap-1.5">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-xs font-medium">
                    <ChevronLeftIcon className="w-3.5 h-3.5" />Previous
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg">{currentPage} / {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-xs font-medium">
                    Next<ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>

      {/* Reject Reason Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Rejection Reason</h3>
            <p className="text-sm text-gray-500 mb-4">Enter a rejection reason for this request:</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              rows={4}
              placeholder="Enter reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end mt-4">
              <Button onClick={() => setRejectModal({ open: false, item: null })}>Cancel</Button>
              <Button type="primary" danger onClick={handleRejectSubmit} disabled={!rejectReason.trim()}>Submit</Button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted Card */}
      {submitted && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl px-10 py-8 flex flex-col items-center gap-3">
            <CheckCircleIcon className="w-12 h-12 text-green-500" />
            <span className="text-xl font-bold text-gray-800">Submitted</span>
          </div>
        </div>
      )}
    </>
  )
}

export default ManagerDashboard
