// import axios from "axios";
// import emailjs from "emailjs-com";
// import { saveAs } from "file-saver";

// // Axios instance
// const api = axios.create({
//   baseURL: "http://127.0.0.1:8000/api",
// });

// // ------------------- Interceptors -------------------
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const refreshAccessToken = async () => {
//   try {
//     const refreshToken = localStorage.getItem("refreshToken");
//     if (!refreshToken) return null;

//     const response = await api.post("/token/refresh/", { refresh: refreshToken });
//     const newAccess = response.data.access;
//     localStorage.setItem("accessToken", newAccess);
//     return newAccess;
//   } catch (err) {
//     console.error("Failed to refresh token", err);
//     return null;
//   }
// };

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       const newAccessToken = await refreshAccessToken();
//       if (newAccessToken) {
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return api(originalRequest);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// // ------------------- Auth APIs -------------------
// export const loginUser = async (email, password) => {
//   try {
//     const response = await api.post("/login/", { email, password });
//     localStorage.setItem("accessToken", response.data.tokens.access);
//     localStorage.setItem("refreshToken", response.data.tokens.refresh);
//     localStorage.setItem("user", JSON.stringify(response.data.user));
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : { error: "Server error" };
//   }
// };

// export const registerUser = async (username, email, password) => {
//   try {
//     const response = await api.post("/register/", { username, email, password });
//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : { error: "Server error" };
//   }
// };

// // ------------------- Employee APIs -------------------
// export const getEmployees = async () => {
//   const response = await api.get("/PostEmployee/");
//   return response.data;
// };

// export const addEmployee = async (employeeData) => {
//   try {
//     const response = await api.post("/GetEmployee/", employeeData);

//     // Send welcome email
//     try {
//       await emailjs.send(
//         "service_yhs3dew",
//         "template_580wpfj",
//         {
//           first_name: employeeData.first_name,
//           department: employeeData.department,
//           email: employeeData.email,
//         },
//         "EAr19Y5xQ_1VnUb6c"
//       );
//     } catch (err) {
//       console.error("EmailJS error:", err);
//     }

//     return response.data;
//   } catch (error) {
//     throw error.response ? error.response.data : { error: "Server error" };
//   }
// };

// export const updateEmployee = async (id, employeeData) => {
//   const response = await api.put(`/GetEmployee/${id}/`, employeeData);
//   return response.data;
// };

// export const deleteEmployee = async (id) => {
//   const response = await api.delete(`/GetEmployee/${id}/`);
//   return response.status === 200 || response.status === 204;
// };

// // ------------------- Profile APIs -------------------
// export const getProfile = async () => {
//   const response = await api.get("/profile/");
//   return response.data;
// };

// export const updateProfile = async (profileData) => {
//   const response = await api.put("/profile/", profileData);
//   return response.data;
// };

// // ------------------- Leave APIs -------------------
// export const getLeaves = async () => {
//   const response = await api.get("/leaves/");
//   return response.data;
// };

// export const createLeaveRequest = async (leaveData) => {
//   const response = await api.post("/leaves/", leaveData);
//   return response.data;
// };

// export const updateLeaveStatus = async (id, status) => {
//   const response = await api.patch(`/leaves/${id}/update-status/`, { status });
//   return response.data;
// };

// export const updateLeave = async (leaveId, payload) => {
//   try {
//     const { data } = await api.patch(`/leaves/${leaveId}/update/`, payload);
//     return data;
//   } catch (error) {
//     console.error("Error updating leave:", error.response?.data || error.message);
//     throw error;
//   }
// };

// export const exportLeavesCSV = async () => {
//   const response = await api.get("/leaves/export_csv/", {
//     responseType: 'blob'
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'leave_requests.csv');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// export const exportLeavesPDF = async () => {
//   const response = await api.get("/leaves/export_pdf/", {
//     responseType: 'blob'
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'leave_requests.pdf');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// // ------------------- WFH APIs -------------------
// export const getWFHRequests = async () => {
//   const response = await api.get("/wfh-requests/");
//   return response.data;
// };

// export const createWFHRequest = async (requestData) => {
//   const response = await api.post("/wfh-requests/", requestData);
//   return response.data;
// };

// export const updateWFHRequest = async (id, updatedData) => {
//   const response = await api.patch(`/wfh-requests/${id}/`, updatedData);
//   return response.data;
// };

// export const deleteWFHRequest = async (id) => {
//   const response = await api.delete(`/wfh-requests/${id}/`);
//   return response.status === 204;
// };

// export const exportWFHCSV = async () => {
//   const response = await api.get("/wfh/export_csv/", { 
//     responseType: "blob" 
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'wfh_requests.csv');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// export const exportWFHPDF = async () => {
//   const response = await api.get("/wfh/export_pdf/", { 
//     responseType: "blob" 
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'wfh_requests.pdf');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// // ------------------- Comp Off APIs -------------------
// export const getCompOffRequests = async () => {
//   const response = await api.get("/comp-off-requests/");
//   return response.data;
// };

// export const createCompOffRequest = async (data) => {
//   const response = await api.post("/comp-off-requests/", data);
//   return response.data;
// };

// export const updateCompOffRequest = async (id, data) => {
//   const response = await api.patch(`/comp-off-requests/${id}/`, data);
//   return response.data;
// };

// export const exportCompOffCSV = async () => {
//   const response = await api.get("/comp-off/export_csv/", {
//     responseType: 'blob'
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'comp_off_requests.csv');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// export const exportCompOffPDF = async () => {
//   const response = await api.get("/comp-off/export_pdf/", {
//     responseType: 'blob'
//   });
//   const url = window.URL.createObjectURL(new Blob([response.data]));
//   const link = document.createElement('a');
//   link.href = url;
//   link.setAttribute('download', 'comp_off_requests.pdf');
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
// };

// export const useCompOff = async (data) => {
//   const response = await api.post("/use-comp-off/", data);
//   return response.data;
// };


// export const getCompOffHistory = async (employeeId) => {
//   const response = await api.get(`/comp-off/history/${employeeId}/`);
//   return response.data;
// };

// export const validateCompOffRequest = async (validationData) => {
//   const response = await api.post('/comp-off/validate/', validationData);
//   return response.data;
// };


// // ------------------- Salary APIs -------------------
// export const getSalaries = async () => {
//   const response = await api.get("/salaries/");
//   return response.data;
// };

// export const addSalary = async (salaryData) => {
//   const response = await api.post("/salaries/", salaryData);
//   return response.data;
// };

// export const updateSalary = async (id, salaryData) => {
//   const response = await api.put(`/salaries/${id}/`, salaryData);
//   return response.data;
// };

// export const deleteSalary = async (id) => {
//   const response = await api.delete(`/salaries/${id}/`);
//   return response.status === 200 || response.status === 204;
// };

// export const getSalaryById = async (id) => {
//   const response = await api.get(`/salaries/${id}/`);
//   return response.data;
// };

// export const downloadSalarySlip = async (salaryId) => {
//   try {
//     const response = await api.get(`/salaries/${salaryId}/generate-slip/`, { responseType: "blob" });
//     saveAs(new Blob([response.data], { type: "application/pdf" }), `SalarySlip_${salaryId}.pdf`);
//   } catch (error) {
//     console.error("Error downloading salary slip:", error.response?.data || error.message);
//     throw error;
//   }
// };

// // ------------------- Monthly Salary APIs -------------------
// export const saveMonthlySalary = async (salaryData) => {
//   const response = await api.post("/monthly-salary/", salaryData);
//   return response.data;
// };

// export const getMonthlySalaryHistory = async (employeeId) => {
//   const response = await api.get(`/monthly-salary/history/${employeeId}/`);
//   return response.data;
// };

// // ------------------- Attendance APIs -------------------


// export const updateAttendance = async (attendanceData) => {
//   const response = await api.post('/attendance/update/', attendanceData);
//   return response.data;
// };

// // ------------------- Salary Slip APIs -------------------
// export const generateSalarySlip = async (employeeId, month, year) => {
//   const response = await api.get(`/salary-slip/${employeeId}/${month}/${year}/`, {
//     responseType: 'blob'
//   });
//   return response.data;
// };

// export const downloadSalarySlipByDetails = async (employeeId, month, year) => {
//   try {
//     const response = await api.get(`/salary-slip/${employeeId}/${month}/${year}/`, { 
//       responseType: "blob" 
//     });
//     saveAs(new Blob([response.data], { type: "application/pdf" }), `SalarySlip_${employeeId}_${month}_${year}.pdf`);
//   } catch (error) {
//     console.error("Error downloading salary slip:", error.response?.data || error.message);
//     throw error;
//   }
// };

// export const getEmployeeDetails = async (employeeId) => {
//   const response = await api.get(`/GetEmployee/${employeeId}/`);
//   return response.data;
// };

// // ------------------- Dashboard APIs -------------------


// export const getMonthlySalaryTrend = async (year = null) => {
//   const url = year ? `/dashboard/monthly-trend/${year}/` : '/dashboard/monthly-trend/';
//   const response = await api.get(url);
//   return response.data;
// };

// export const getDepartmentWiseSalary = async (year = null, month = null) => {
//   let url = '/dashboard/department-salary/';
//   if (year !== null && month !== null) {
//     url = `/dashboard/department-salary/${year}/${month}/`;
//   }
//   const response = await api.get(url);
//   return response.data;
// };

// export const getAttendanceAnalytics = async (year = null, month = null) => {
//   let url = '/dashboard/attendance-analytics/';
//   if (year !== null && month !== null) {
//     url = `/dashboard/attendance-analytics/${year}/${month}/`;
//   }
//   const response = await api.get(url);
//   return response.data;
// };

// export const getSalaryDistribution = async () => {
//   const response = await api.get('/dashboard/salary-distribution/');
//   return response.data;
// };

// export const getRecentActivities = async () => {
//   const response = await api.get('/dashboard/recent-activities/');
//   return response.data;
// };  

// // ------------------- Work Session APIs -------------------
// export const startWorkSession = async (sessionType, requestId) => {
//   const response = await api.post('/work-session/start/', {
//     session_type: sessionType,
//     request_id: requestId
//   });
//   return response.data;
// };

// export const endWorkSession = async (sessionId) => {
//   const response = await api.post(`/work-session/end/${sessionId}/`);
//   return response.data;
// };

// export const trackActivity = async (sessionId, activityType, details = {}) => {
//   const response = await api.post(`/work-session/activity/${sessionId}/`, {
//     activity_type: activityType,
//     details: details
//   });
//   return response.data;
// };

// export const getActiveSessions = async () => {
//   const response = await api.get('/work-session/active/');
//   return response.data;
// };

// export const getWorkSessionHistory = async () => {
//   const response = await api.get('/work-session/history/');
//   return response.data;
// };

// // ------------------- Professional Work Session APIs -------------------
// export const startWorkSessionWithNotes = async (sessionType, requestId, startNote) => {
//   const response = await api.post('/work-session/start-with-notes/', {
//     session_type: sessionType,
//     request_id: requestId,
//     start_note: startNote
//   });
//   return response.data;
// };

// export const endWorkSessionWithReport = async (sessionId, reportData) => {
//   const response = await api.post(`/work-session/end-with-report/${sessionId}/`, reportData);
//   return response.data;
// };

// export const addSessionNote = async (sessionId, noteData) => {
//   const response = await api.post(`/work-session/add-note/${sessionId}/`, noteData);
//   return response.data;
// };

// export const getSessionDetails = async (sessionId) => {
//   const response = await api.get(`/work-session/details/${sessionId}/`);
//   return response.data;
// };

// export const getEmployeeWorkReports = async (days = 30) => {
//   const response = await api.get(`/work-reports/${days}/`);
//   return response.data;
// };

// // ------------------- Admin Monitoring APIs -------------------
// export const getAllActiveSessions = async () => {
//   const response = await api.get('/admin/active-sessions/');
//   return response.data;
// };

// export const getEmployeeAnalytics = async (employeeId) => {
//   const response = await api.get(`/admin/employee-analytics/${employeeId}/`);
//   return response.data;
// };

// export const getDepartmentAnalytics = async (department) => {
//   const response = await api.get(`/admin/department-analytics/${department}/`);
//   return response.data;
// };

// export const adminGetEmployeeWorkDetails = async (employeeId) => {
//   const response = await api.get(`/admin/employee-work-details/${employeeId}/`);
//   return response.data;
// };

// export const adminGetDetailedSession = async (sessionId) => {
//   const response = await api.get(`/admin/session-details/${sessionId}/`);
//   return response.data;
// };

// // ------------------- Dashboard APIs -------------------
// export const getEmployeeHomeData = async () => {
//   const response = await api.get('/employee/home/');
//   return response.data;
// };

// export const getAdminHomeData = async () => {
//   const response = await api.get('/admin/home/');
//   return response.data;
// };

// // ------------------- Employee Analytics APIs -------------------
// export const getEmployeeProductivityAnalytics = async () => {
//   const response = await api.get('/employee/analytics/productivity/');
//   return response.data;
// };

// export const getEmployeeActivityTimeline = async () => {
//   const response = await api.get('/employee/analytics/timeline/');
//   return response.data;
// };

// export const getEmployeePerformanceStats = async () => {
//   const response = await api.get('/employee/analytics/performance-stats/');
//   return response.data;
// };

// export const getEmployeeCalendarEvents = async (year = null, month = null) => {
//   let url = '/employee/calendar/events/';
//   if (year && month) {
//     url = `/employee/calendar/events/${year}/${month}/`;
//   }
//   const response = await api.get(url);
//   return response.data;
// };

// // ------------------- Enhanced APIs -------------------
// export const generateProfessionalSalarySlip = async (employeeId, month, year) => {
//   const response = await api.get(`/salary-slip/${employeeId}/${month}/${year}/`, {
//     responseType: 'blob'
//   });
//   return response.data;
// };

// export const downloadProfessionalSalarySlip = async (employeeId, month, year) => {
//   try {
//     const blob = await generateProfessionalSalarySlip(employeeId, month, year);
//     saveAs(blob, `Professional_Salary_Slip_${employeeId}_${month}_${year}.pdf`);
//   } catch (error) {
//     console.error("Error downloading professional salary slip:", error);
//     throw error;
//   }
// };

// export const getCompOffBalance = async (employeeId, month = null, year = null) => {
//   let url = `/comp-off/balance/${employeeId}/`;
//   if (month !== null && year !== null) {
//     url += `?month=${month}&year=${year}`;
//   }
//   const response = await api.get(url);
//   return response.data;
// };

// export const getCompOffSummary = async (employeeId) => {
//   const response = await api.get(`/comp-off/summary/${employeeId}/`);
//   return response.data;
// };

// export const useCompOffBalance = async (data) => {
//   const response = await api.post('/comp-off/use-balance/', data);
//   return response.data;
// };

// // ------------------- Attendance APIs - UPDATED -------------------
// export const getAttendanceWithLeaves = async (employeeId, month, year) => {
//   if (!employeeId) {
//     throw new Error("Employee ID is required");
//   }
//   const response = await api.get(`/attendance/${employeeId}/${month}/${year}/`);
//   return response.data;
// };

// // ------------------- Dashboard APIs - UPDATED -------------------
// export const getDashboardSummary = async () => {
//   const response = await api.get('/dashboard/summary-stats/');
//   return response.data;
// };


// export default api;



import axios from "axios";
import { saveAs } from "file-saver";

// Axios instance
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// ------------------- Interceptors -------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = '/';
      return null;
    }

    const response = await axios.post(`${API_BASE}/api/token/refresh/`, { refresh: refreshToken });
    const newAccess = response.data.access;
    localStorage.setItem("accessToken", newAccess);
    return newAccess;
  } catch (err) {
    console.error("Failed to refresh token", err);
    localStorage.clear();
    window.location.href = '/';
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } else {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// ------------------- One Time IST Time APIs -------------------
// api.js - Remove multiple time APIs, keep only one
export const getOneTimeISTTime = async () => {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await axios.get(`${API_BASE}/api/get-one-time-ist-time/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    // Store for client-side use
    localStorage.setItem('server_ist_reference', response.data.current_ist_time);
    localStorage.setItem('last_time_sync', new Date().toISOString());
    
    return response;
  } catch (error) {
    // Always return client IST as fallback
    const clientIST = getClientISTTime();
    return {
      data: {
        current_ist_time: clientIST,
        is_fallback: true
      }
    };
  }
};

// Client-side only time function - कोई API call नहीं
export const getClientISTTime = (date = new Date()) => {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '') + ' IST';
};

// Check if we need to sync with server
export const shouldSyncWithServer = () => {
  const lastSync = localStorage.getItem('last_sync_time');
  if (!lastSync) return true;
  
  const lastSyncTime = new Date(lastSync);
  const now = new Date();
  const diffMinutes = (now - lastSyncTime) / (1000 * 60);
  
  // Sync only if last sync was more than 30 minutes ago
  return diffMinutes > 30;
};

// ------------------- Auth APIs -------------------
export const loginUser = async (email, password) => {
  try {
    const response = await api.post("/login/", { email, password });
    localStorage.setItem("accessToken", response.data.tokens.access);
    localStorage.setItem("refreshToken", response.data.tokens.refresh);
    localStorage.setItem("user", JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

export const registerUser = async (username, email, password) => {
  try {
    const response = await api.post("/register/", { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

// ------------------- OTP Registration APIs -------------------
export const sendOTP = async (email) => {
  try {
    const response = await api.post("/register/", { email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

export const verifyOTPAndRegister = async (email, otp, username, password) => {
  try {
    const response = await api.post("/verify-otp/", { email, otp, username, password });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

export const resendOTP = async (email) => {
  try {
    const response = await api.post("/resend-otp/", { email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

// ------------------- Employee APIs -------------------
export const getEmployees = async () => {
  const response = await api.get("/PostEmployee/");
  return response.data;
};

export const addEmployee = async (employeeData) => {
  try {
    const response = await api.post("/GetEmployee/", employeeData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { error: "Server error" };
  }
};

export const updateEmployee = async (id, employeeData) => {
  const response = await api.put(`/GetEmployee/${id}/`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/GetEmployee/${id}/`);
  return response.status === 200 || response.status === 204;
};

// ------------------- Profile APIs -------------------
export const getProfile = async () => {
  const response = await api.get("/profile/");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/profile/", profileData);
  return response.data;
};

// ------------------- Leave APIs -------------------
export const getLeaves = async () => {
  const response = await api.get("/leaves/");
  return response.data;
};

export const createLeaveRequest = async (leaveData) => {
  const response = await api.post("/leaves/", leaveData);
  return response.data;
};

export const updateLeaveStatus = async (id, status, rejection_reason = "") => {
  const response = await api.patch(`/leaves/${id}/update-status/`, { status, rejection_reason });
  return response.data;
};

export const updateLeave = async (leaveId, payload) => {
  try {
    const { data } = await api.patch(`/leaves/${leaveId}/update/`, payload);
    return data;
  } catch (error) {
    console.error("Error updating leave:", error.response?.data || error.message);
    throw error;
  }
};

export const exportLeavesCSV = async () => {
  const response = await api.get("/leaves/export_csv/", {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'leave_requests.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportLeavesPDF = async () => {
  const response = await api.get("/leaves/export_pdf/", {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'leave_requests.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ------------------- WFH APIs -------------------
export const getWFHRequests = async () => {
  const response = await api.get("/wfh-requests/");
  return response.data;
};

export const createWFHRequest = async (requestData) => {
  const response = await api.post("/wfh-requests/", requestData);
  return response.data;
};

export const updateWFHRequest = async (id, updatedData) => {
  const response = await api.patch(`/wfh-requests/${id}/`, updatedData);
  return response.data;
};

export const deleteWFHRequest = async (id) => {
  const response = await api.delete(`/wfh-requests/${id}/`);
  return response.status === 204;
};

export const exportWFHCSV = async () => {
  const response = await api.get("/wfh/export_csv/", { 
    responseType: "blob" 
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'wfh_requests.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportWFHPDF = async () => {
  const response = await api.get("/wfh/export_pdf/", { 
    responseType: "blob" 
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'wfh_requests.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ------------------- Comp Off APIs -------------------
export const getCompOffRequests = async () => {
  const response = await api.get("/comp-off-requests/");
  return response.data;
};

export const createCompOffRequest = async (data) => {
  const response = await api.post("/comp-off-requests/", data);
  return response.data;
};

export const updateCompOffRequest = async (id, data) => {
  const response = await api.patch(`/comp-off-requests/${id}/`, data);
  return response.data;
};

export const exportCompOffCSV = async () => {
  const response = await api.get("/comp-off/export_csv/", {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'comp_off_requests.csv');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const exportCompOffPDF = async () => {
  const response = await api.get("/comp-off/export_pdf/", {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'comp_off_requests.pdf');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const useCompOff = async (data) => {
  const response = await api.post("/use-comp-off/", data);
  return response.data;
};

export const getCompOffHistory = async (employeeId) => {
  const response = await api.get(`/comp-off/history/${employeeId}/`);
  return response.data;
};

export const validateCompOffRequest = async (validationData) => {
  const response = await api.post('/comp-off/validate/', validationData);
  return response.data;
};

// ------------------- Salary APIs -------------------
export const getSalaries = async () => {
  const response = await api.get("/salaries/");
  return response.data;
};

export const addSalary = async (salaryData) => {
  const response = await api.post("/salaries/", salaryData);
  return response.data;
};

export const updateSalary = async (id, salaryData) => {
  const response = await api.put(`/salaries/${id}/`, salaryData);
  return response.data;
};

export const deleteSalary = async (id) => {
  const response = await api.delete(`/salaries/${id}/`);
  return response.status === 200 || response.status === 204;
};

export const getSalaryById = async (id) => {
  const response = await api.get(`/salaries/${id}/`);
  return response.data;
};

export const downloadSalarySlip = async (salaryId) => {
  try {
    const response = await api.get(`/salaries/${salaryId}/generate-slip/`, { responseType: "blob" });
    saveAs(new Blob([response.data], { type: "application/pdf" }), `SalarySlip_${salaryId}.pdf`);
  } catch (error) {
    console.error("Error downloading salary slip:", error.response?.data || error.message);
    throw error;
  }
};

// ------------------- Monthly Salary APIs -------------------
export const saveMonthlySalary = async (salaryData) => {
  const response = await api.post("/monthly-salary/", salaryData);
  return response.data;
};

export const getMonthlySalaryHistory = async (employeeId) => {
  const response = await api.get(`/monthly-salary/history/${employeeId}/`);
  return response.data;
};

// ------------------- Attendance APIs -------------------
export const updateAttendance = async (attendanceData) => {
  const response = await api.post('/attendance/update/', attendanceData);
  return response.data;
};

// ------------------- Salary Slip APIs -------------------
export const generateSalarySlip = async (employeeId, month, year) => {
  const response = await api.get(`/salary-slip/${employeeId}/${month}/${year}/`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadSalarySlipByDetails = async (employeeId, month, year) => {
  try {
    const response = await api.get(`/salary-slip-html/${employeeId}/${month}/${year}/`, { 
      responseType: "blob" 
    });
    saveAs(new Blob([response.data], { type: "application/pdf" }), `SalarySlip_${employeeId}_${month}_${year}.pdf`);
  } catch (error) {
    console.error("Error downloading salary slip:", error.response?.data || error.message);
    throw error;
  }
};

export const getEmployeeDetails = async (employeeId) => {
  const response = await api.get(`/GetEmployee/${employeeId}/`);
  return response.data;
};

// ------------------- Dashboard APIs -------------------
export const getMonthlySalaryTrend = async (year = null) => {
  const url = year ? `/dashboard/monthly-trend/${year}/` : '/dashboard/monthly-trend/';
  const response = await api.get(url);
  return response.data;
};

export const getDepartmentWiseSalary = async (year = null, month = null) => {
  let url = '/dashboard/department-salary/';
  if (year !== null && month !== null) {
    url = `/dashboard/department-salary/${year}/${month}/`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getAttendanceAnalytics = async (year = null, month = null) => {
  let url = '/dashboard/attendance-analytics/';
  if (year !== null && month !== null) {
    url = `/dashboard/attendance-analytics/${year}/${month}/`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getSalaryDistribution = async () => {
  const response = await api.get('/dashboard/salary-distribution/');
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await api.get('/dashboard/recent-activities/');
  return response.data;
};



// ------------------- Work Session APIs -------------------
export const startWorkSession = async (sessionType, requestId) => {
  const response = await api.post('/work-session/start/', {
    session_type: sessionType,
    request_id: requestId
  });
  return response.data;
};

export const endWorkSession = async (sessionId) => {
  const response = await api.post(`/work-session/end/${sessionId}/`);
  return response.data;
};

export const trackActivity = async (sessionId, activityType, details = {}) => {
  const response = await api.post(`/work-session/activity/${sessionId}/`, {
    activity_type: activityType,
    details: details
  });
  return response.data;
};

export const getActiveSessions = async () => {
  const response = await api.get('/work-session/active/');
  return response.data;
};

export const getWorkSessionHistory = async () => {
  const response = await api.get('/work-session/history/');
  return response.data;
};

// ------------------- MODERN Work Session APIs (Task-Based) -------------------
export const startWorkSessionWithNotes = async (sessionType, requestId, startNote, tasksPlanned = [], energyLevel = 3) => {
  const response = await api.post('/work-session/start-with-notes/', {
    session_type: sessionType,
    request_id: requestId,
    start_note: startNote,
    tasks_planned: tasksPlanned,
    energy_level: energyLevel
  });
  return response.data;
};

export const endWorkSessionWithReport = async (sessionId, reportData) => {
  const response = await api.post(`/work-session/end-with-report/${sessionId}/`, reportData);
  return response.data;
};

// MODERN: Task Management APIs
export const addTaskToSession = async (sessionId, task, priority = 'medium') => {
  const response = await api.post(`/work-session/add-task/${sessionId}/`, {
    task,
    priority
  });
  return response.data;
};

export const completeTaskInSession = async (sessionId, task, timeSpent = '0h') => {
  const response = await api.post(`/work-session/complete-task/${sessionId}/`, {
    task,
    time_spent: timeSpent
  });
  return response.data;
};

export const addBreakToSession = async (sessionId, breakType = 'short', duration = 15) => {
  const response = await api.post(`/work-session/add-break/${sessionId}/`, {
    break_type: breakType,
    duration
  });
  return response.data;
};

export const addSessionNote = async (sessionId, noteData) => {
  const response = await api.post(`/work-session/add-note/${sessionId}/`, noteData);
  return response.data;
};

export const getSessionDetails = async (sessionId) => {
  const response = await api.get(`/work-session/details/${sessionId}/`);
  return response.data;
};

export const getEmployeeWorkReports = async (days = 30) => {
  const response = await api.get(`/work-reports/${days}/`);
  return response.data;
};

// ------------------- Admin Monitoring APIs -------------------
export const getAllActiveSessions = async () => {
  const response = await api.get('/admin/active-sessions/');
  return response.data;
};

export const getEmployeeAnalytics = async (employeeId) => {
  const response = await api.get(`/admin/employee-analytics/${employeeId}/`);
  return response.data;
};

export const getDepartmentAnalytics = async (department) => {
  const response = await api.get(`/admin/department-analytics/${department}/`);
  return response.data;
};

export const adminGetEmployeeWorkDetails = async (employeeId) => {
  const response = await api.get(`/admin/employee-work-details/${employeeId}/`);
  return response.data;
};

export const adminGetDetailedSession = async (sessionId) => {
  const response = await api.get(`/admin/session-details/${sessionId}/`);
  return response.data;
};

// ------------------- Dashboard APIs -------------------
export const getEmployeeHomeData = async () => {
  const response = await api.get('/employee/home/');
  return response.data;
};

export const getAdminHomeData = async () => {
  const response = await api.get('/admin/home/');
  return response.data;
};

// ------------------- Employee Analytics APIs -------------------
export const getEmployeeProductivityAnalytics = async () => {
  const response = await api.get('/employee/analytics/productivity/');
  return response.data;
};

export const getEmployeeActivityTimeline = async () => {
  const response = await api.get('/employee/analytics/timeline/');
  return response.data;
};

export const getEmployeePerformanceStats = async () => {
  const response = await api.get('/employee/analytics/performance-stats/');
  return response.data;
};

export const getEmployeeCalendarEvents = async (year = null, month = null) => {
  let url = '/employee/calendar/events/';
  if (year && month) {
    url = `/employee/calendar/events/${year}/${month}/`;
  }
  const response = await api.get(url);
  return response.data;
};

// ------------------- Enhanced APIs -------------------
export const generateProfessionalSalarySlip = async (employeeId, month, year) => {
  const response = await api.get(`/salary-slip-html/${employeeId}/${month}/${year}/`, {
    responseType: 'blob'
  });
  return response.data;
};

export const downloadProfessionalSalarySlip = async (employeeId, month, year) => {
  try {
    const blob = await generateProfessionalSalarySlip(employeeId, month, year);
    saveAs(blob, `Salary_Slip_${employeeId}_${month}_${year}.pdf`);
  } catch (error) {
    console.error("Error downloading professional salary slip:", error);
    throw error;
  }
};

export const getCompOffBalance = async (employeeId, month = null, year = null) => {
  let url = `/comp-off/balance/${employeeId}/`;
  if (month !== null && year !== null) {
    url += `?month=${month}&year=${year}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getCompOffSummary = async (employeeId) => {
  const response = await api.get(`/comp-off/summary/${employeeId}/`);
  return response.data;
};

export const useCompOffBalance = async (data) => {
  const response = await api.post('/comp-off/use-balance/', data);
  return response.data;
};

// ------------------- Attendance APIs - UPDATED -------------------
export const getAttendanceWithLeaves = async (employeeId, month, year) => {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }
  const response = await api.get(`/attendance/${employeeId}/${month}/${year}/`);
  return response.data;
};

// ------------------- Dashboard APIs - UPDATED -------------------
export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/summary-stats/');
  return response.data;
};

// ------------------- Notification APIs -------------------
export const getPendingRequestsCount = async () => {
  const response = await api.get('/notifications/pending-count/');
  return response.data;
};

export const getEmployeeNotifications = async (lastCheck = null) => {
  const url = lastCheck 
    ? `/notifications/employee/?last_check=${encodeURIComponent(lastCheck)}`
    : '/notifications/employee/';
  const response = await api.get(url);
  return response.data;
};

// ------------------- Revision Request Notifications -------------------
export const getRevisionRequestNotifications = async () => {
  try {
    const response = await api.get('/employee-form/revision-status/');
    return response.data;
  } catch (error) {
    // If API doesn't exist, try getting from employee home data
    try {
      const homeResponse = await api.get('/employee/home/');
      return {
        revision_requested: homeResponse.data.revision_requested || false,
        revision_message: homeResponse.data.revision_message || '',
        incomplete_fields: homeResponse.data.incomplete_fields || []
      };
    } catch (homeError) {
      console.error('Error fetching revision status:', homeError);
      return {
        revision_requested: false,
        revision_message: '',
        incomplete_fields: []
      };
    }
  }
};

// ------------------- Calculate Monthly Salary API -------------------
export const calculateMonthlySalary = async (salaryData) => {
  const response = await api.post('/monthly-salary/calculate/', salaryData);
  return response.data;
};

export const downloadMonthlySalaryExcel = async (month, year) => {
  const response = await api.get('/monthly-salary/download-excel/', {
    params: { month, year },
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
  link.setAttribute('download', `Salary_Report_${monthName}_${year}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

// ------------------- Offer Letter APIs -------------------
export const getOfferLetter = async (employeeId) => {
  const response = await api.get(`/offer-letter/${employeeId}/`);
  return response.data;
};

export const generateOfferLetter = async (employeeId, offerDate, ctc) => {
  const response = await api.post('/offer-letter/generate/', {
    employee_id: employeeId,
    offer_date: offerDate,
    ctc: parseFloat(ctc)
  });
  return response.data;
};

export const sendOfferLetterEmail = async (employeeId) => {
  const response = await api.post(`/offer-letter/send/${employeeId}/`);
  return response.data;
};

// ------------------- Relieving Letter APIs -------------------
export const generateRelievingLetter = async (employeeId, relievingDate, lastWorkingDay) => {
  const response = await api.post('/relieving-letter/generate/', {
    employee_id: employeeId,
    relieving_date: relievingDate,
    last_working_day: lastWorkingDay
  });
  return response.data;
};

export const sendRelievingLetterEmail = async (employeeId) => {
  const response = await api.post(`/relieving-letter/send/${employeeId}/`);
  return response.data;
};

// ------------------- Employee Form APIs -------------------
export const getEmployeeProfile = async () => {
  const response = await api.get('/employee-form/get/');
  return response.data;
};

export const getAllEmployeesBankDetails = async () => {
  const response = await api.get('/employee-form/all/');
  return response.data;
};

export const submitEmployeeForm = async (formDataToSend) => {
  const response = await api.post('/employee-form/submit/', formDataToSend, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateEmployeeProfile = async (formDataToSend) => {
  const response = await api.put('/employee-form/update/', formDataToSend, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const clearRevisionRequest = async () => {
  const response = await api.post('/employee-form/clear-revision/');
  return response.data;
};

// ------------------- Leave Management APIs -------------------
export const getCompanyLeaves = async (month, year) => {
  const response = await api.get(`/company-leaves/?month=${month}&year=${year}`);
  return response.data;
};

export const getSaturdayOverrides = async (month, year) => {
  const response = await api.get(`/saturday-overrides/?month=${month}&year=${year}`);
  return response.data;
};

export const addCompanyLeave = async (leaveData) => {
  const response = await api.post('/company-leaves/', leaveData);
  return response.data;
};

export const deleteCompanyLeave = async (date) => {
  const response = await api.delete(`/company-leaves/${date}/`);
  return response.status === 204;
};

export const updateSaturdayOverride = async (overrideData) => {
  const response = await api.post('/saturday-overrides/', overrideData);
  return response.data;
};

// ------------------- Comp Off Usage Notification APIs -------------------
export const getCompOffUsageNotifications = async () => {
  const response = await api.get('/comp-off/usage-notifications/');
  return response.data;
};

export const respondCompOffNotification = async (notificationId, useCompOff) => {
  const response = await api.post(`/comp-off/usage-notifications/${notificationId}/respond/`, {
    use_comp_off: useCompOff
  });
  return response.data;
};

export const sendCompOffUsageNotifications = async () => {
  const response = await api.post('/comp-off/send-usage-notifications/');
  return response.data;
};

export const discardExpiredCompOffNotifications = async () => {
  const response = await api.post('/comp-off/discard-expired-notifications/');
  return response.data;
};

export default api;



// ------------------- ACCOUNTING APIs -------------------
export const getAccountingDashboard = () => api.get('/accounting/dashboard/').then(r => r.data);

// Customers
export const getCustomers = () => api.get('/accounting/customers/').then(r => r.data);
export const createCustomer = (data) => api.post('/accounting/customers/', data).then(r => r.data);
export const updateCustomer = (id, data) => api.put(`/accounting/customers/${id}/`, data).then(r => r.data);
export const deleteCustomer = (id) => api.delete(`/accounting/customers/${id}/`);

// Invoices
export const getInvoices = (params = {}) => api.get('/accounting/invoices/', { params }).then(r => r.data);
export const getUnpaidInvoices = () => api.get('/accounting/invoices/unpaid/').then(r => r.data);
export const createInvoice = (data) => api.post('/accounting/invoices/', data).then(r => r.data);
export const updateInvoice = (id, data) => api.put(`/accounting/invoices/${id}/`, data).then(r => r.data);
export const deleteInvoice = (id) => api.delete(`/accounting/invoices/${id}/`);

// Payments
export const getPayments = (params = {}) => api.get('/accounting/payments/', { params }).then(r => r.data);
export const createPayment = (data) => api.post('/accounting/payments/', data).then(r => r.data);
export const deletePayment = (id) => api.delete(`/accounting/payments/${id}/`);

// Expenses
export const getExpenses = (params = {}) => api.get('/accounting/expenses/', { params }).then(r => r.data);
export const createExpense = (data) => api.post('/accounting/expenses/', data).then(r => r.data);
export const updateExpense = (id, data) => api.put(`/accounting/expenses/${id}/`, data).then(r => r.data);
export const deleteExpense = (id) => api.delete(`/accounting/expenses/${id}/`);

// Salary Expenses
export const getSalaryExpenses = (params = {}) => api.get('/accounting/salary-expenses/', { params }).then(r => r.data);
export const createSalaryExpense = (data) => api.post('/accounting/salary-expenses/', data).then(r => r.data);
export const updateSalaryExpense = (id, data) => api.patch(`/accounting/salary-expenses/${id}/`, data).then(r => r.data);
export const getSalaryExpenseReport = (params = {}) => api.get('/accounting/salary-expenses/report/', { params }).then(r => r.data);

// Auto-sync from SalaryCreate: create or update SalaryExpense
export const upsertSalaryExpense = async (data) => {
  const existing = await api.get('/accounting/salary-expenses/', {
    params: { employee: data.employee, month: data.month, year: data.year }
  }).then(r => r.data);
  const records = existing.results ?? existing;
  if (records.length > 0) {
    return api.patch(`/accounting/salary-expenses/${records[0].id}/`, data).then(r => r.data);
  }
  return api.post('/accounting/salary-expenses/', data).then(r => r.data);
};

// Employees list for accounting dropdowns
export const getAccountingEmployees = () => api.get('/accounting/employees-list/').then(r => r.data);
