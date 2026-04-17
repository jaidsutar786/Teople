import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import {
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  XCircleIcon,
  InformationCircleIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline"
import * as XLSX from 'xlsx'
import { Modal, Button, Divider, Space, Spin, Empty, Table } from 'antd'
import ErrorCard from './ErrorCard'
import {
  getMonthlySalaryHistory,
  getAttendanceWithLeaves,
  updateAttendance,
  getCompOffBalance,
  useCompOffBalance as applyCompOffBalance,
  getEmployeeDetails,
  getCompOffSummary,
  calculateMonthlySalary,
  downloadProfessionalSalarySlip,
  getCompanyLeaves,
  getSaturdayOverrides,
  upsertSalaryExpense
} from "../api"
import { toast } from "react-hot-toast"

const SalaryAttendance = ({ employeeId, employeeName, employeeMonthlySalary, routeId, routeSearchParams }) => {
  const [attendanceData, setAttendanceData] = useState([])
  const [employeeInfo, setEmployeeInfo] = useState({})
  const [employeeDetails, setEmployeeDetails] = useState({})

  // ✅ FIXED: Clear month handling
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth()) // 0-indexed (0-11) for frontend
  const [year, setYear] = useState(currentDate.getFullYear())

  const [presentDays, setPresentDays] = useState(0)
  const [finalSalary, setFinalSalary] = useState(0)
  const [isGenerated, setIsGenerated] = useState(false)
  const [salaryHistory, setSalaryHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [approvedLeaveDates, setApprovedLeaveDates] = useState([])
  const [approvedWFHDates, setApprovedWFHDates] = useState([])
  const [approvedCompOffDates, setApprovedCompOffDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeoutId, setTimeoutId] = useState(null)

  const [compOffBalance, setCompOffBalance] = useState(0)
  const [compOffSummary, setCompOffSummary] = useState(null)
  const [salaryCalculationMethod, setSalaryCalculationMethod] = useState("with_comp_off")
  const [compOffToUse, setCompOffToUse] = useState(0)
  const [maxCompOffAvailable, setMaxCompOffAvailable] = useState(0)
  const [carryForwardToUse, setCarryForwardToUse] = useState(0)
  const [maxCarryForwardAvailable, setMaxCarryForwardAvailable] = useState(0)
  const [showCompOffDialog, setShowCompOffDialog] = useState(false)
  const [showSalarySlip, setShowSalarySlip] = useState(false)
  const [currentSalaryData, setCurrentSalaryData] = useState(null)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [compOffBalanceDetails, setCompOffBalanceDetails] = useState(null)
  const [companyLeaves, setCompanyLeaves] = useState([])
  const [saturdayOverrides, setSaturdayOverrides] = useState({})
  const [showHalfDayModal, setShowHalfDayModal] = useState(false)
  const [managedHalfDays, setManagedHalfDays] = useState(new Set())
  const [selectedDate, setSelectedDate] = useState(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [errorCard, setErrorCard] = useState({
    visible: false,
    type: 'error',
    title: 'ERROR',
    message: '',
    description: '',
    buttonText: 'Try Again',
    onButtonClick: () => {}
  })

  const id = employeeId ?? routeId
  // ✅ FIXED: Utility function to convert 0-indexed to 1-indexed month
  const getBackendMonth = (frontendMonth) => {
    return frontendMonth + 1; // Convert 0-indexed to 1-indexed
  }

  // ✅ FIXED: Utility function to convert 1-indexed to 0-indexed month
  const getFrontendMonth = (backendMonth) => {
    return backendMonth - 1; // Convert 1-indexed to 0-indexed
  }

  // ✅ FIXED: Get correct month name for display
  const getMonthName = (monthIndex = month) => {
    return new Date(year, monthIndex).toLocaleString("default", { month: "long" })
  }

  // Convert 24h time to 12h format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convert 12h time to 24h format
  const formatTimeTo24Hour = (time12, period) => {
    if (!time12) return '';

    const [hoursStr, minutesStr] = time12.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);

    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Calculate hours between in and out time
  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return null;

    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const [outHours, outMinutes] = outTime.split(':').map(Number);

    let totalInMinutes = inHours * 60 + inMinutes;
    let totalOutMinutes = outHours * 60 + outMinutes;

    if (totalOutMinutes < totalInMinutes) {
      totalOutMinutes += 24 * 60;
    }

    const totalMinutes = totalOutMinutes - totalInMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  // Calculate total hours in decimal for salary calculation
  const calculateTotalHoursDecimal = (inTime, outTime) => {
    if (!inTime || !outTime) return 0;

    const [inHours, inMinutes] = inTime.split(':').map(Number);
    const [outHours, outMinutes] = outTime.split(':').map(Number);

    let totalInMinutes = inHours * 60 + inMinutes;
    let totalOutMinutes = outHours * 60 + outMinutes;

    if (totalOutMinutes < totalInMinutes) {
      totalOutMinutes += 24 * 60;
    }

    const totalMinutes = totalOutMinutes - totalInMinutes;
    return (totalMinutes / 60).toFixed(2);
  };

  // ✅ Count days with <9 hours in month (for display only, backend handles auto half day)
  const countLowHoursInMonth = (data) => {
    let count = 0;
    for (let i = 0; i < data.length; i++) {
      const day = data[i];
      if (!day || day.isWeekend || day.isOnLeave || day.isOnWFH || day.isOnCompOff) continue;
      if (day.totalHours && parseFloat(day.totalHours) < 9) {
        count++;
      }
    }
    return count;
  };

  // Convert decimal hours to readable format (e.g., 8.93 -> "8h 56m")
  const formatDecimalHours = (decimalHours) => {
    if (!decimalHours) return '0h 0m';
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Extract time and period from 12h format
  const extractTimeAndPeriod = (time12h) => {
    if (!time12h) return { time: '', period: 'AM' };

    if (time12h.includes('AM') || time12h.includes('PM')) {
      const timePart = time12h.split(' ')[0];
      const period = time12h.split(' ')[1] || 'AM';
      return { time: timePart, period };
    }

    return { time: time12h, period: 'AM' };
  };

  useEffect(() => {
    const name = employeeName ?? routeSearchParams?.get?.("name")
    const monthlySalary = employeeMonthlySalary ?? routeSearchParams?.get?.("monthlySalary")
    const resolvedId = id
    if (resolvedId) {
      setEmployeeInfo({
        id: resolvedId,
        name,
        monthlySalary: Number.parseFloat(monthlySalary) || 0,
      })
      // ✅ Immediately load employee details after setting ID
      loadEmployeeDetailsById(resolvedId)
      loadCompOffSummaryById(resolvedId)
    }
  }, [id, employeeName, employeeMonthlySalary])

  const loadEmployeeDetailsById = async (empId) => {
    if (!empId) return
    try {
      const details = await getEmployeeDetails(empId)
      console.log('👤 Employee details loaded:', details)
      setEmployeeDetails(details)
    } catch (err) {
      console.error("Failed to load employee details:", err)
    }
  }

  const loadCompOffSummaryById = async (empId) => {
    if (!empId) return
    try {
      const summary = await getCompOffSummary(empId)
      setCompOffSummary(summary)
    } catch (err) {
      console.error("Failed to load comp off summary:", err)
    }
  }

  useEffect(() => {
    if (!employeeInfo.id) return
    const load = async () => {
      await Promise.all([loadSalaryHistory(), loadCompOffBalance()])
      const [leaves, overrides] = await Promise.all([
        getCompanyLeaves(getBackendMonth(month), year),
        getSaturdayOverrides(getBackendMonth(month), year)
      ])
      const leavesDates = leaves.map(l => l.date)
      setCompanyLeaves(leavesDates)
      setSaturdayOverrides(overrides)
      // attendance initialize after overrides are set
      initializeAttendanceDataWith(leavesDates, overrides)
      await loadAttendanceWithLeaves()
    }
    load()
  }, [employeeInfo.id, month, year])

  // Load managed half days from attendance data
  useEffect(() => {
    if (attendanceData.length > 0) {
      const adminCoveredDates = attendanceData
        .filter(day => day && day.status === 'present' && day.admin_covered)
        .map(day => day.date);
      
      if (adminCoveredDates.length > 0) {
        setManagedHalfDays(new Set(adminCoveredDates));
        console.log('📝 Loaded admin covered dates:', adminCoveredDates);
      }
    }
  }, [attendanceData])

  const loadLeaveManagementData = async () => {
    try {
      const [leaves, overrides] = await Promise.all([
        getCompanyLeaves(getBackendMonth(month), year),
        getSaturdayOverrides(getBackendMonth(month), year)
      ])
      setCompanyLeaves(leaves.map(l => l.date))
      setSaturdayOverrides(overrides)
    } catch (err) {
      console.error("Failed to load leave management data:", err)
    }
  }

  const handleMonthChange = (newMonth) => {
    setMonth(newMonth)
  }

  const handleYearChange = (newYear) => {
    setYear(newYear)
  }

  const loadCompOffSummary = async () => {
    if (!employeeInfo.id) return
    try {
      const summary = await getCompOffSummary(employeeInfo.id)
      setCompOffSummary(summary)
    } catch (err) {
      console.error("Failed to load comp off summary:", err)
    }
  }

  const loadEmployeeDetails = async () => {
    if (!employeeInfo.id) return
    try {
      const details = await getEmployeeDetails(employeeInfo.id)
      setEmployeeDetails(details)
    } catch (err) {
      console.error("Failed to load employee details:", err)
    }
  }

  const loadCompOffBalance = async () => {
    if (!employeeInfo.id) return
    try {
      const balanceData = await getCompOffBalance(employeeInfo.id, getBackendMonth(month), year)
      if (balanceData.balance_hours !== undefined) {
        setCompOffBalance(balanceData.balance_hours)
      } else if (balanceData.balance !== undefined) {
        setCompOffBalance(balanceData.balance)
      } else {
        setCompOffBalance(0)
      }
      setCompOffBalanceDetails(balanceData)
    } catch (err) {
      console.error("Failed to load comp off balance:", err)
      setCompOffBalance(0)
    }
  }

  const loadAttendanceWithLeaves = async () => {
    if (!employeeInfo.id) return
    try {
      setLoading(true)
      const data = await getAttendanceWithLeaves(employeeInfo.id, month, year)
      setApprovedLeaveDates(data.leave_dates || [])
      setApprovedWFHDates(data.wfh_dates || [])
      setApprovedCompOffDates(data.comp_off_dates || [])

      setAttendanceData((prevData) => {
        return prevData.map((day) => {
          if (!day) return day

          const dateStr = day.date
          const attendanceRecord = data.attendance_records?.find((record) => record.date === dateStr)

          if (attendanceRecord) {
            const inTimeData = extractTimeAndPeriod(attendanceRecord.in_time_12h);
            const outTimeData = extractTimeAndPeriod(attendanceRecord.out_time_12h);

            return {
              ...day,
              inTime: attendanceRecord.in_time || "",
              outTime: attendanceRecord.out_time || "",
              inTime12h: inTimeData.time,
              outTime12h: outTimeData.time,
              inTimePeriod: inTimeData.period,
              outTimePeriod: outTimeData.period,
              totalHours: attendanceRecord.total_hours || null,
              present: attendanceRecord.status === "present",
              isOnLeave: attendanceRecord.status === "leave",
              isOnWFH: attendanceRecord.status === "wfh",
              isOnCompOff: attendanceRecord.status === "comp_off",
              status: attendanceRecord.status,
              admin_covered: attendanceRecord.admin_covered || false // Add admin_covered field
            }
          }

          const isOnLeave = data.leave_dates?.includes(dateStr) || false
          const isOnWFH = data.wfh_dates?.includes(dateStr) || false
          const isOnCompOff = data.comp_off_dates?.includes(dateStr) || false

          return {
            ...day,
            isOnLeave: isOnLeave,
            isOnWFH: isOnWFH,
            isOnCompOff: isOnCompOff,
            status: isOnCompOff ? 'comp_off' : isOnWFH ? 'wfh' : isOnLeave ? 'leave' : 'absent'
          }
        })
      })
    } catch (err) {
      console.error("❌ Failed to load attendance with leaves:", err)
      toast.error("Failed to load attendance data")
    } finally {
      setLoading(false)
    }
  }

  const loadSalaryHistory = async () => {    if (!employeeInfo.id) return
    setLoadingHistory(true)
    try {
      const history = await getMonthlySalaryHistory(employeeInfo.id)
      const transformedHistory = history.map(record => ({
        ...record,
        frontendMonth: getFrontendMonth(record.month),
        displayMonth: new Date(record.year, getFrontendMonth(record.month)).toLocaleString("default", { month: "short" })
      }))
      setSalaryHistory(transformedHistory)
    } catch (err) {
      console.error("Failed to load salary history:", err)
      toast.error("Failed to load salary history")
    } finally {
      setLoadingHistory(false)
    }
  }

  const getDayName = (date) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()]

  const formatLocalDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const isWeekend = (date, overridesData = saturdayOverrides) => {
    return isWeekendWith(date, companyLeaves, overridesData)
  }

  const initializeAttendanceDataWith = (leaveDates, overrides) => {
    if (!employeeInfo.id) return
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const data = []
    for (let i = 0; i < firstDayOfMonth; i++) data.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = formatLocalDate(date)
      const isCompanyLeave = leaveDates.includes(dateStr)
      const weekendStatus = isWeekendWith(date, leaveDates, overrides)
      data.push({
        date: dateStr, day: getDayName(date), dateNumber: day,
        inTime: "", outTime: "", inTime12h: "", outTime12h: "",
        inTimePeriod: "AM", outTimePeriod: "PM", totalHours: null,
        present: false, status: 'absent', isWeekend: weekendStatus,
        isOnLeave: false, isOnWFH: false, isOnCompOff: false,
        isHoliday: false, isCompanyLeave,
      })
    }
    setAttendanceData(data)
  }

  const isWeekendWith = (date, leaveDates, overridesData) => {
    const day = date.getDay()
    const dateStr = formatLocalDate(date)
    if (leaveDates.includes(dateStr)) return true
    if (day === 0) return true
    if (day === 6) {
      if (overridesData[dateStr]) return overridesData[dateStr] === 'off'
      const weekNumber = Math.ceil(date.getDate() / 7)
      return weekNumber === 2 || weekNumber === 4
    }
    return false
  }

  const initializeAttendanceData = () => {
    initializeAttendanceDataWith(companyLeaves, saturdayOverrides)
  }

  const handleTimeChange = async (index, field, value) => {
    if (!employeeInfo.id) {
      toast.error("Employee ID not available")
      return
    }

    const updatedData = [...attendanceData]
    const dayData = updatedData[index]

    if (!dayData || dayData.isWeekend || dayData.isOnLeave || dayData.isOnWFH || dayData.isOnCompOff) return

    dayData[field] = value

    // Auto-set AM/PM based on hours when time is typed
    if (field === 'inTime12h' && value) {
      const hours = parseInt(value.split(':')[0])
      if (!isNaN(hours)) {
        // In time: 1-11 = AM (morning aana), 12+ = PM, 0 = AM (midnight)
        dayData.inTimePeriod = (hours === 0) ? 'AM' : (hours >= 12) ? 'PM' : 'AM'
      }
    }
    if (field === 'outTime12h' && value) {
      const hours = parseInt(value.split(':')[0])
      if (!isNaN(hours)) {
        // Out time: 1-11 = PM (shaam ko nikalna), 12+ = PM, 0 = AM (midnight)
        dayData.outTimePeriod = (hours === 0) ? 'AM' : (hours >= 12) ? 'PM' : 'PM'
      }
    }

    if ((field.includes('inTime') || field.includes('outTime')) && dayData.inTime12h && dayData.outTime12h) {
      const inTime24 = formatTimeTo24Hour(dayData.inTime12h, dayData.inTimePeriod);
      const outTime24 = formatTimeTo24Hour(dayData.outTime12h, dayData.outTimePeriod);

      if (inTime24 && outTime24) {
        dayData.totalHours = calculateTotalHoursDecimal(inTime24, outTime24);
        dayData.present = true;
        dayData.status = 'present';

        if (parseFloat(dayData.totalHours) < 7) {
          dayData.status = 'half_day';
        }

        // Backend will handle auto half day on 4th time
      }
    }

    setAttendanceData(updatedData);

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(async () => {
      try {
        const inTime24 = formatTimeTo24Hour(dayData.inTime12h, dayData.inTimePeriod);
        const outTime24 = formatTimeTo24Hour(dayData.outTime12h, dayData.outTimePeriod);

        const response = await updateAttendance({
          employee_id: employeeInfo.id,
          date: dayData.date,
          in_time: inTime24 || null,
          out_time: outTime24 || null,
          status: dayData.status,
        })

        if (response?.data) {
          // ✅ FIXED: Force immediate UI update with backend status
          setAttendanceData(prevData => {
            return prevData.map((item, idx) => {
              if (idx === index && item) {
                return {
                  ...item,
                  totalHours: response.data.total_hours,
                  status: response.data.status,  // ✅ Use backend status
                  present: response.data.status === 'present' || response.data.status === 'half_day',
                  inTime12h: dayData.inTime12h,
                  outTime12h: dayData.outTime12h,
                  inTimePeriod: dayData.inTimePeriod,
                  outTimePeriod: dayData.outTimePeriod
                };
              }
              return item;
            });
          });
          
          // ✅ Show appropriate message
          const hours = parseFloat(response.data.total_hours);
          const count = response.data.less_than_9_hours_count || 0;
          const graceRemaining = response.data.grace_remaining || 0;
          
          if (response.data.status === 'half_day') {
            if (hours < 7) {
              toast.error(`Half Day! (worked ${hours.toFixed(1)}h < 7h)`);
            } else {
              toast.error(`Half Day! (4th time with <9h this month)`);
            }
          } else if (hours < 9) {
            toast(`⚠️ <9 hours (${count}/3 grace days used, ${graceRemaining} remaining)`, { icon: '⚠️' });
          } else {
            toast.success(`✅ Present (worked ${hours.toFixed(1)}h)`);
          }
        }
      } catch (err) {
        console.error("❌ Failed to save attendance:", err)
        toast.error("Failed to save attendance changes")
      }
    }, 1000)

    setTimeoutId(newTimeoutId)
  }

  const handleExcelUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log('📁 File selected:', file.name)
    setUploadingExcel(true)
    const loadingToast = toast.loading('📊 Reading Excel file...')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

      console.log('📋 Excel data loaded, rows:', jsonData.length)
      console.log('🔍 First few rows:', jsonData.slice(0, 5))
      
      let excelMonth = null
      let excelYear = null
      
      // Extract month/year from Excel data (search for "Attendance date:2026-02-01 ~2026-02-25")
      for (let i = 0; i < Math.min(10, jsonData.length); i++) {
        const row = jsonData[i]
        if (row && Array.isArray(row)) {
          for (let cell of row) {
            if (cell && typeof cell === 'string' && cell.includes('Attendance date:')) {
              const dateMatch = cell.match(/Attendance date:(\d{4})-(\d{2})/)
              if (dateMatch) {
                excelYear = parseInt(dateMatch[1])
                excelMonth = parseInt(dateMatch[2]) - 1 // Convert to 0-indexed
                console.log('📅 Found date in Excel:', { excelMonth, excelYear, cell })
                break
              }
            }
          }
          if (excelMonth !== null && excelYear !== null) break
        }
      }
      
      // Fallback: Extract from file name if not found in Excel
      if (excelMonth === null || excelYear === null) {
        const fileNameMatch = file.name.match(/(\d{1,2}|January|February|March|April|May|June|July|August|September|October|November|December)[_\s]+(\d{4})/i)
        if (fileNameMatch) {
          const monthPart = fileNameMatch[1]
          excelYear = parseInt(fileNameMatch[2])
          
          const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
          const monthIndex = monthNames.indexOf(monthPart.toLowerCase())
          excelMonth = monthIndex !== -1 ? monthIndex : parseInt(monthPart) - 1
          console.log('📅 Extracted from file name:', { excelMonth, excelYear, fileName: file.name })
        }
      }
      
      if (excelMonth !== null && excelYear !== null) {
        console.log('📅 Excel data month/year:', { excelMonth, excelYear })
        console.log('📅 Current UI month/year:', { month, year })
        
        if (excelMonth !== month || excelYear !== year) {
          const excelMonthName = new Date(2000, excelMonth).toLocaleString('default', { month: 'long' })
          const currentMonthName = new Date(2000, month).toLocaleString('default', { month: 'long' })
          
          toast.dismiss(loadingToast)
          setErrorCard({
            visible: true,
            type: 'error',
            title: 'MONTH MISMATCH - UPLOAD BLOCKED',
            message: `Excel: ${excelMonthName} ${excelYear} | UI: ${currentMonthName} ${year}`,
            description: `The Excel file contains ${excelMonthName} ${excelYear} data, but you have selected ${currentMonthName} ${year} in the UI.\n\nPlease select the correct month/year in the UI dropdown before uploading.`,
            buttonText: 'OK',
            onButtonClick: () => {}
          })
          console.error('❌ Month mismatch detected - upload BLOCKED')
          setUploadingExcel(false)
          event.target.value = ''
          return
        }
      } else {
        toast.dismiss(loadingToast)
        setErrorCard({
          visible: true,
          type: 'error',
          title: 'INVALID EXCEL FORMAT',
          message: 'Cannot detect month/year from Excel file',
          description: `The Excel file must contain "Attendance date:YYYY-MM-DD" in the header.\n\nExample: "Attendance date:2026-02-01 ~2026-02-25"`,
          buttonText: 'OK',
          onButtonClick: () => {}
        })
        console.error('❌ No date found in Excel data - upload BLOCKED')
        setUploadingExcel(false)
        event.target.value = ''
        return
      }
      
      toast.loading('🔍 Finding employee data...', { id: loadingToast })

      // Find employee row by UserID or Name
      let employeeRowIndex = -1
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        
        // Check all columns for UserID or Name
        for (let col = 0; col < row.length; col++) {
          const cellValue = row[col]
          const nextCell = row[col + 1]
          
          // Match by UserID
          if (cellValue === 'UserID:' && nextCell == employeeInfo.id) {
            employeeRowIndex = i
            console.log('✅ Employee found by ID at row:', i, 'column:', col)
            break
          }
          
          // Match by Name
          if (cellValue === 'Name:' && nextCell && 
              String(nextCell).toLowerCase().includes(employeeInfo.name.toLowerCase())) {
            employeeRowIndex = i
            console.log('✅ Employee found by Name at row:', i, 'column:', col)
            break
          }
        }
        
        if (employeeRowIndex !== -1) break
      }

      if (employeeRowIndex === -1) {
        console.log('❌ Employee not found. Looking for:', employeeInfo.id, employeeInfo.name)
        toast.error(`❌ Employee "${employeeInfo.name}" (ID: ${employeeInfo.id}) not found in Excel`, { id: loadingToast })
        setUploadingExcel(false)
        return
      }

      toast.loading('⏰ Processing attendance times...', { id: loadingToast })

      // Get the employee's data rows
      const employeeHeaderRow = jsonData[employeeRowIndex]
      const dateRow = jsonData[employeeRowIndex + 1]
      const inTimeRow = jsonData[employeeRowIndex + 2]
      const outTimeRow = jsonData[employeeRowIndex + 3]

      console.log('📅 Employee header:', employeeHeaderRow)
      console.log('📅 Date row:', dateRow)
      console.log('⏰ In times:', inTimeRow)
      console.log('⏰ Out times:', outTimeRow)

      let updatedCount = 0
      let skippedCount = 0
      const updatedData = [...attendanceData]

      // Find where dates start (after Name, Dept columns)
      let dateStartCol = 0
      for (let col = 0; col < dateRow.length; col++) {
        if (typeof dateRow[col] === 'number' && dateRow[col] >= 1 && dateRow[col] <= 31) {
          dateStartCol = col
          console.log('📍 Dates start at column:', col)
          break
        }
      }

      // Process each date column
      for (let colIndex = dateStartCol; colIndex < dateRow.length; colIndex++) {
        const dayNumber = dateRow[colIndex]
        if (typeof dayNumber !== 'number' || dayNumber < 1 || dayNumber > 31) continue

        const inTime = inTimeRow[colIndex]
        const outTime = outTimeRow[colIndex]

        if (!inTime || !outTime) {
          console.log(`⏭️ Skipping day ${dayNumber} - no times`)
          continue
        }

        // Find matching day in attendance data
        const dayIndex = updatedData.findIndex(day => day && day.dateNumber === dayNumber)
        if (dayIndex === -1) {
          console.log(`⚠️ Day ${dayNumber} not found in calendar`)
          continue
        }

        const dayData = updatedData[dayIndex]
        if (dayData.isWeekend || dayData.isOnLeave || dayData.isOnWFH || dayData.isOnCompOff) {
          console.log(`⏭️ Skipping day ${dayNumber} - weekend/leave`)
          skippedCount++
          continue
        }

        // Parse time from Excel (format: HH:MM)
        const parseExcelTime = (timeStr) => {
          if (!timeStr) return null
          
          // Handle Excel time format (decimal like 0.4375 = 10:30)
          if (typeof timeStr === 'number') {
            const totalMinutes = Math.round(timeStr * 24 * 60)
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          }
          
          // Handle string format HH:MM
          const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2})/)
          if (!timeMatch) return null
          return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
        }

        const parsedInTime = parseExcelTime(inTime)
        const parsedOutTime = parseExcelTime(outTime)

        if (!parsedInTime || !parsedOutTime) {
          console.log(`⚠️ Failed to parse times for day ${dayNumber}:`, inTime, outTime)
          continue
        }

        console.log(`✅ Day ${dayNumber}: ${parsedInTime} - ${parsedOutTime}`)

        // Determine AM/PM
        const getTimePeriod = (timeStr) => {
          const [hours] = timeStr.split(':').map(Number)
          return hours >= 12 ? 'PM' : 'AM'
        }

        const convert24To12 = (time24) => {
          const [hours, minutes] = time24.split(':').map(Number)
          const hours12 = hours % 12 || 12
          return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        }

        dayData.inTime12h = convert24To12(parsedInTime)
        dayData.outTime12h = convert24To12(parsedOutTime)
        dayData.inTimePeriod = getTimePeriod(parsedInTime)
        dayData.outTimePeriod = getTimePeriod(parsedOutTime)
        dayData.totalHours = calculateTotalHoursDecimal(parsedInTime, parsedOutTime)
        dayData.present = true
        dayData.status = parseFloat(dayData.totalHours) < 7 ? 'half_day' : 'present'

        toast.loading(`💾 Saving day ${dayNumber}... (${updatedCount + 1})`, { id: loadingToast })

        // Save to backend
        try {
          await updateAttendance({
            employee_id: employeeInfo.id,
            date: dayData.date,
            in_time: parsedInTime,
            out_time: parsedOutTime,
            status: dayData.status,
          })
          updatedCount++
          console.log(`✅ Saved day ${dayNumber}`)
        } catch (err) {
          console.error(`❌ Failed to save ${dayData.date}:`, err)
        }
      }

      setAttendanceData(updatedData)
      await loadAttendanceWithLeaves()
      await loadSalaryHistory()

      toast.dismiss(loadingToast)
      setErrorCard({
        visible: true,
        type: 'success',
        title: 'SUCCESS',
        message: 'Upload Complete!',
        description: `✅ ${updatedCount} days uploaded\n⏭️ ${skippedCount} days skipped (weekend/leave)`,
        buttonText: 'Continue',
        onButtonClick: () => {}
      })
      console.log('🎉 Upload complete:', { updatedCount, skippedCount })
    } catch (err) {
      console.error('❌ Excel upload error:', err)
      toast.error(`❌ Upload failed: ${err.message}`, { id: loadingToast })
    } finally {
      setUploadingExcel(false)
      event.target.value = ''
    }
  }

  const handleHalfDayToggle = async (index) => {
    if (!employeeInfo.id) {
      toast.error("Employee ID not available")
      return
    }

    const updatedData = [...attendanceData]
    const dayData = updatedData[index]

    if (!dayData || dayData.isWeekend || dayData.isOnLeave || dayData.isOnWFH || dayData.isOnCompOff) return

    const newStatus = dayData.status === 'half_day' ? 'present' : 'half_day'

    // Set default times if marking as half day without times
    if (newStatus === 'half_day' && !dayData.inTime12h && !dayData.outTime12h) {
      dayData.inTime12h = '09:00'
      dayData.outTime12h = '02:00'
      dayData.inTimePeriod = 'AM'
      dayData.outTimePeriod = 'PM'
      dayData.totalHours = '5.00'
    }

    dayData.status = newStatus
    dayData.present = newStatus === 'present'
    setAttendanceData(updatedData)

    try {
      const inTime24 = formatTimeTo24Hour(dayData.inTime12h, dayData.inTimePeriod);
      const outTime24 = formatTimeTo24Hour(dayData.outTime12h, dayData.outTimePeriod);

      const response = await updateAttendance({
        employee_id: employeeInfo.id,
        date: dayData.date,
        in_time: inTime24 || null,
        out_time: outTime24 || null,
        status: newStatus,
        force_half_day: newStatus === 'half_day',
      })
      
      if (response?.data) {
        dayData.status = response.data.status;
        dayData.totalHours = response.data.total_hours || dayData.totalHours;
        setAttendanceData([...updatedData]);
      }
      
      toast.success(`Marked as ${newStatus === 'half_day' ? 'Half Day' : 'Present'}`)
    } catch (err) {
      console.error("❌ Failed to update attendance:", err)
      toast.error("Failed to update attendance")
    }
  }

  const calculateWorkingStats = () => {
    const totalDaysInMonth = attendanceData.filter((d) => d).length
    const workingDays = attendanceData.filter((d) => d && !d.isWeekend).length
    const paidWeeklyOffs = attendanceData.filter((d) => d && d.isWeekend).length
    const presentDaysCount = attendanceData.filter(
      (d) => d && d.status === 'present' && !d.isWeekend && !d.isOnLeave && !d.isOnWFH && !d.isOnCompOff,
    ).length
    const halfDaysCount = attendanceData.filter(
      (d) => d && d.status === 'half_day' && !d.isWeekend && !d.isOnLeave && !d.isOnWFH && !d.isOnCompOff
    ).length
    const leaveDaysCount = attendanceData.filter((d) => d && d.isOnLeave && !d.isWeekend).length
    const wfhDaysCount = attendanceData.filter((d) => d && d.isOnWFH && !d.isWeekend).length
    const compOffDaysCount = attendanceData.filter((d) => d && d.isOnCompOff && !d.isWeekend).length
    
    // Calculate effective half days after admin management
    const effectiveHalfDaysCount = halfDaysCount - managedHalfDays.size

    return {
      totalDaysInMonth,
      workingDays,
      paidWeeklyOffs,
      presentDaysCount,
      halfDaysCount,
      effectiveHalfDaysCount,
      leaveDaysCount,
      wfhDaysCount,
      compOffDaysCount,
    }
  }

  const getStatusText = (day) => {
    if (!day) return ""
    if (day.isCompanyLeave) return "Company Leave"
    if (day.isWeekend) {
      const date = new Date(day.date);
      if (date.getDay() === 6) {
        // Check if Saturday is working or off
        if (saturdayOverrides[day.date]) {
          return saturdayOverrides[day.date] === 'working' ? "Working Saturday" : "Paid Saturday";
        }
        const dayOfMonth = date.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        return (weekNumber === 2 || weekNumber === 4) ? "Paid Saturday" : "Working Saturday";
      }
      return "Weekend";
    }
    if (day.isOnLeave) return "Leave"
    if (day.isOnWFH) return "WFH (Full Day)"
    if (day.isOnCompOff) return "Comp Off"
    
    // Check if this is an admin covered half day (from state or database)
    if ((day.status === 'present' && day.admin_covered) || managedHalfDays.has(day.date)) {
      return "Admin Covered"
    }
    
    if (day.status === 'half_day') {
      // Different text for direct half day vs 4th time half day
      if (day.totalHours && parseFloat(day.totalHours) < 7) {
        return "Direct Half Day" // For <7 hours
      }
      return "Half Day (4th time)" // For 4th time <9 hours
    }
    if (day.present) return "Present"
    return "Absent"
  }

  const isPaidSaturdayCheck = (dateStr) => {
    const date = new Date(dateStr);
    if (date.getDay() !== 6) return false; // Not Saturday

    const dayOfMonth = date.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    return weekNumber === 2 || weekNumber === 4; // 2nd and 4th Saturday are paid
  }

  const getStatusColor = (day) => {
    if (!day) return "text-gray-400"
    if (day.isWeekend) return "text-slate-600"
    if (day.isOnLeave) return "text-amber-700 font-semibold"
    if (day.isOnWFH) return "text-violet-700 font-semibold"
    if (day.isOnCompOff) return "text-sky-700 font-semibold"
    
    // Check if this is an admin covered half day (from state or database)
    if ((day.status === 'present' && day.admin_covered) || managedHalfDays.has(day.date)) {
      return "text-purple-800 font-bold" // Purple color for admin covered
    }
    
    if (day.status === 'half_day') {
      // Different colors for direct half day vs 4th time half day
      if (day.totalHours && parseFloat(day.totalHours) < 7) {
        return "text-red-700 font-semibold" // Red for direct half day (<7 hours)
      }
      return "text-orange-700 font-semibold" // Orange for 4th time half day
    }
    if (day.present) return "text-emerald-700"
    return "text-gray-600"
  }

  // ✅ AUTOMATIC: Calculate and apply carry forward & comp off without asking user
  const showCompOffUsageDialog = async () => {
    const stats = calculateWorkingStats()

    // ✅ Calculate according to exact rules
    const monthlyPaidLeave = 1.5; // Every month includes 1.5 Paid Leave
    const unpaidLeaves = Math.max(0, stats.leaveDaysCount - monthlyPaidLeave);

    // Only count half days that are not managed by admin
    const effectiveHalfDays = stats.halfDaysCount - managedHalfDays.size;
    const halfDaysRequiringCoverage = effectiveHalfDays;

    // ✅ Get previous month's carry forward
    let previousCarryForward = 0;
    try {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      
      const prevRecord = salaryHistory.find(
        r => r.frontendMonth === prevMonth && r.year === prevYear
      );
      
      previousCarryForward = prevRecord?.new_carry_forward || 0;
      
      console.log('✅ Previous carry forward:', previousCarryForward);
    } catch (err) {
      console.log('❌ Error finding previous carry forward:', err);
    }

    // Calculate available resources
    const maxCompOffCanUseInDays = Math.floor(compOffBalance / 9);
    const totalRequiredAdjustment = unpaidLeaves + (halfDaysRequiringCoverage * 0.5);

    console.log('🔍 Automatic Adjustment Calculation:', {
      unpaidLeaves,
      halfDaysRequiringCoverage,
      totalRequiredAdjustment,
      previousCarryForward,
      maxCompOffCanUseInDays
    });

    // ✅ If no adjustments needed
    if (unpaidLeaves === 0 && halfDaysRequiringCoverage === 0) {
      console.log('✅ No adjustments needed - proceeding directly');
      toast.success("No unpaid leaves or half days requiring adjustment!")
      await processSalaryCalculation(stats, 0, "new_half_day_comp_off_rules");
      return
    }

    // ✅ AUTOMATIC PRIORITY: Carry Forward → Comp Off → Salary Cut
    let carryForwardToUse = 0;
    let compOffToUse = 0;
    let remainingAdjustment = totalRequiredAdjustment;

    // Step 1: Use Carry Forward first (automatic)
    if (previousCarryForward > 0 && remainingAdjustment > 0) {
      carryForwardToUse = Math.min(previousCarryForward, remainingAdjustment);
      remainingAdjustment -= carryForwardToUse;
      console.log(`✅ Auto-using ${carryForwardToUse} carry forward half days`);
    }

    // Step 2: Use Comp Off if still needed (automatic)
    if (maxCompOffCanUseInDays > 0 && remainingAdjustment > 0) {
      compOffToUse = Math.min(maxCompOffCanUseInDays, remainingAdjustment);
      remainingAdjustment -= compOffToUse;
      console.log(`✅ Auto-using ${compOffToUse} comp off days`);
    }

    // Step 3: Remaining will be salary cut
    const salaryCutDays = Math.max(0, remainingAdjustment);

    // Show summary message
    let message = '🔄 Automatic Adjustment Applied:\n';
    if (carryForwardToUse > 0) {
      message += `✅ ${carryForwardToUse} carry forward half days used\n`;
    }
    if (compOffToUse > 0) {
      message += `✅ ${compOffToUse} comp off days used\n`;
    }
    if (salaryCutDays > 0) {
      message += `⚠️ ${salaryCutDays.toFixed(1)} days salary cut remaining`;
    } else {
      message += '✅ No salary cut needed!';
    }

    toast.success(message, { duration: 5000 });

    // ✅ Set values and proceed automatically
    setCompOffToUse(compOffToUse);
    setCarryForwardToUse(carryForwardToUse);
    
    // Proceed with calculation automatically
    await processSalaryCalculation(stats, compOffToUse, "with_comp_off");
  }

  // ✅ FIXED: Salary calculation with proper month handling
  const calculateSalary = async () => {
    if (!employeeInfo.id) {
      toast.error("Employee information not available")
      return
    }

    const stats = calculateWorkingStats()

    if (stats.workingDays === 0) {
      toast.error("No working days found for this month!")
      return
    }

    console.log('🔍 Salary Calculation Triggered:', {
      frontendMonth: month,
      backendMonth: getBackendMonth(month),
      monthName: getMonthName(),
      year: year,
      leaveDaysCount: stats.leaveDaysCount,
      halfDaysCount: stats.halfDaysCount,
      compOffBalance: compOffBalance
    })

    const hasUnpaidLeaves = stats.leaveDaysCount > 0;
    const hasHalfDays = stats.halfDaysCount > 0;
    const hasCompOffBalance = compOffBalance > 0;

    console.log('🔍 Modal Check:', {
      hasUnpaidLeaves,
      hasHalfDays, 
      hasCompOffBalance,
      leaveDaysCount: stats.leaveDaysCount,
      halfDaysCount: stats.halfDaysCount,
      compOffBalance,
      shouldShowModal: hasCompOffBalance && (hasUnpaidLeaves || hasHalfDays)
    });

    // ✅ FIXED: Show modal if comp off available AND (leaves OR half days exist)
    if (hasCompOffBalance && (hasUnpaidLeaves || hasHalfDays)) {
      console.log('💰 Showing comp off dialog - comp off available with leaves/half days')
      showCompOffUsageDialog()
      return
    }

    console.log('🔄 Direct backend calculation - no comp off or no leaves/half days')
    await processSalaryCalculation(stats, 0, "new_half_day_comp_off_rules")
  }

  const processSalaryCalculation = async (stats, compOffUsed = 0, method = "new_half_day_comp_off_rules") => {
    try {
      console.log('🚀 Calling backend calculation API...');

      // ✅ FIXED: Use proper backend month conversion
      const backendMonth = getBackendMonth(month);

      // Attendance already updated in calculateSalary function
      console.log('📝 Attendance should already be updated for covered half days');

      const requestData = {
        employee_id: employeeInfo.id,
        month: backendMonth, // ✅ Correct 1-indexed month
        year: year,
        // ✅ CRITICAL FIX: Only send manual values if user actually selected non-zero values
        manual_comp_off_to_use: (method === "with_comp_off" && compOffToUse > 0) ? compOffToUse : null,
        manual_carry_forward_to_use: (method === "with_comp_off" && carryForwardToUse > 0) ? carryForwardToUse : null,
      };

      console.log('📤 Request data for backend:', requestData);
      console.log('💼 Manual selections:', {
        compOffToUse,
        carryForwardToUse,
        method,
        message: 'Attendance already updated, backend should see updated data'
      });

      const calculatedData = await calculateMonthlySalary(requestData);

      console.log('✅ Backend calculation result:', calculatedData);

      if (calculatedData.error) {
        throw new Error(calculatedData.error);
      }

      const finalSalaryRounded = calculatedData.final_salary;

      setPresentDays(calculatedData.attendance_summary?.present_days || calculatedData.present_days)
      setFinalSalary(finalSalaryRounded)

      setCurrentSalaryData({
        present_days: calculatedData.attendance_summary?.present_days || calculatedData.present_days,
        half_days: calculatedData.attendance_summary?.half_days || calculatedData.half_days,
        leave_days: calculatedData.attendance_summary?.leave_days || calculatedData.leave_days,
        wfh_days: calculatedData.attendance_summary?.wfh_days || calculatedData.wfh_days,
        comp_off_days: calculatedData.attendance_summary?.comp_off_days || calculatedData.comp_off_days,
        comp_off_used: calculatedData.comp_off_info?.total_used || 0,
        comp_off_carry_forward: calculatedData.comp_off_info?.remaining_balance || 0,
        total_working_days: calculatedData.attendance_summary?.total_working_days || stats.workingDays,
        total_days_in_month: calculatedData.total_days_in_month || 31,
        gross_monthly_salary: employeeInfo.monthlySalary,
        professional_tax: 200,
        final_salary: finalSalaryRounded,
        unpaid_leaves: calculatedData.calculation_details?.unpaid_leaves_after_adjustment || 0,
        carry_forward_details: calculatedData.carry_forward_info,
        calculation_details: calculatedData.calculation_details,
        comp_off_info: calculatedData.comp_off_info
      })

      if (calculatedData.comp_off_info?.total_used > 0) {
        const hoursUsed = calculatedData.comp_off_info.total_used * 9
        await applyCompOffBalance({
          employee_id: employeeInfo.id,
          hours_used: hoursUsed,
          month: backendMonth, // ✅ Use backend month
          year: year,
        })

        await loadCompOffBalance()
        await loadCompOffSummary()
      }

      console.log("✅ Monthly salary calculated and saved by backend!")
      toast.success("Salary calculated and saved successfully!")

      // Auto-sync to Accounting > Salary Expense
      try {
        const syncData = {
          employee: employeeInfo.id,
          month: backendMonth,
          year: year,
          basic_salary: parseFloat(employeeInfo.monthlySalary).toFixed(2),
          bonus: 0,
          deductions: 200, // professional tax
          net_salary: parseFloat(finalSalaryRounded).toFixed(2), // ✅ Round to 2 decimals
          notes: `Auto-synced from salary generation for ${getMonthName()} ${year}`,
        };
        
        console.log('💰 Syncing to Salary Expense:', syncData);
        console.log('🔍 Final Salary Value:', finalSalaryRounded, typeof finalSalaryRounded);
        
        const syncResult = await upsertSalaryExpense(syncData);
        console.log('✅ Salary expense sync result:', syncResult);
      } catch (syncErr) {
        console.error('❌ Accounting sync failed:', syncErr)
        console.error('❌ Sync error details:', syncErr.response?.data);
      }

      setIsGenerated(true)
      setShowSalarySlip(true)
      await loadSalaryHistory()
      
      // ✅ CRITICAL FIX: Reload comp off balance after salary calculation
      await loadCompOffBalance()
      await loadCompOffSummary()

      await loadAttendanceWithLeaves()

    } catch (err) {
      console.error("❌ Failed to calculate/save salary:", err)
      toast.error(err.message || "Failed to calculate salary. Please try again.")
    }
  }

  // ✅ No longer needed - automatic calculation
  const handleCompOffConfirmation = () => {
    const stats = calculateWorkingStats()
    setShowCompOffDialog(false)
    const finalCompOffToUse = salaryCalculationMethod === "with_comp_off" ? compOffToUse : 0
    processSalaryCalculation(stats, finalCompOffToUse, salaryCalculationMethod)
  }

  // ✅ FIXED: PDF download with proper month handling
  const handleDownloadPDF = async () => {
    if (!employeeInfo.id) {
      toast.error("Employee information not available")
      return
    }

    try {
      setGeneratingPDF(true)

      // ✅ FIXED: Use proper backend month conversion
      const backendMonth = getBackendMonth(month);

      console.log('📄 Downloading PDF for:', {
        employeeId: employeeInfo.id,
        frontendMonth: month,
        backendMonth: backendMonth,
        monthName: getMonthName(),
        year: year
      });

      // ✅ Use API function instead of direct fetch
      await downloadProfessionalSalarySlip(employeeInfo.id, backendMonth, year);

      setGeneratingPDF(false);
      const monthName = getMonthName();
      toast.success(`Salary slip for ${monthName} ${year} downloaded successfully!`)

    } catch (err) {
      console.error("Error downloading PDF:", err)
      setGeneratingPDF(false)
      toast.error("Failed to download salary slip. Please try again.")
    }
  }

  // ✅ FIXED: History PDF download with proper month conversion
  const handleDownloadMonthlyPDF = async (employeeId, recordFrontendMonth, recordYear) => {
    try {
      // ✅ FIXED: Convert frontend month to backend month
      const backendMonth = getBackendMonth(recordFrontendMonth);

      console.log('📄 Downloading history PDF for:', {
        employeeId,
        frontendMonth: recordFrontendMonth,
        backendMonth: backendMonth,
        year: recordYear
      });

      // ✅ Use API function instead of direct fetch
      await downloadProfessionalSalarySlip(employeeId, backendMonth, recordYear);

      const monthName = new Date(recordYear, recordFrontendMonth).toLocaleString('default', { month: 'long' });
      toast.success(`Salary slip for ${monthName} ${recordYear} downloaded successfully!`)

    } catch (err) {
      console.error("Error downloading monthly PDF:", err);
      toast.error("Failed to download salary slip for this month.");
    }
  };

  const getDayClassName = (day) => {
    if (!day) return "bg-gray-50"
    if (day.isCompanyLeave) return "bg-purple-100 border-purple-400"
    if (day.isWeekend) {
      const date = new Date(day.date);
      if (date.getDay() === 6) {
        // Check if Saturday is working or off
        if (saturdayOverrides[day.date]) {
          return saturdayOverrides[day.date] === 'working' ? "bg-blue-100 border-blue-400" : "bg-green-100 border-green-400";
        }
        const dayOfMonth = date.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        return (weekNumber === 2 || weekNumber === 4) ? "bg-green-100 border-green-400" : "bg-blue-100 border-blue-400";
      }
      return "bg-slate-100 border-slate-300";
    }
    if (day.isOnLeave) return "bg-amber-50 border-amber-300"
    if (day.isOnWFH) return "bg-violet-50 border-violet-300"
    if (day.isOnCompOff) return "bg-sky-50 border-sky-300"
    
    // Check if this is an admin covered half day (from state or database)
    if ((day.status === 'present' && day.admin_covered) || managedHalfDays.has(day.date)) {
      return "bg-purple-200 border-purple-500" // Special purple color for admin covered
    }
    
    if (day.status === 'half_day') {
      // Check if it's a direct half day (<7 hours) or 4th time half day
      if (day.totalHours && parseFloat(day.totalHours) < 7) {
        return "bg-red-50 border-red-400" // Red for direct half day (<7 hours)
      }
      return "bg-orange-50 border-orange-300" // Orange for 4th time half day
    }
    if (day.totalHours && parseFloat(day.totalHours) < 9 && day.present) return "bg-yellow-50 border-yellow-300"
    if (day.present) return "bg-emerald-50 border-emerald-300"
    return "bg-white border-gray-300"
  }

  const CarryForwardMessage = () => {
    const carryForwardData = currentSalaryData?.carry_forward_info;
    const calculationDetails = currentSalaryData?.calculation_details;

    if (!carryForwardData && !calculationDetails) {
      const stats = calculateWorkingStats();

      // Show message based on new rules
      if (stats.leaveDaysCount === 0 && stats.halfDaysCount === 0) {
        return (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 mb-1">Perfect Attendance This Month</p>
                <p className="text-sm text-green-700">
                  ✅ 1.5 Paid Leave will carry forward to next month
                  {stats.halfDaysCount === 0 && " + No half days to adjust"}
                </p>
              </div>
            </div>
          </div>
        );
      }

      if (stats.leaveDaysCount <= 1.5 && stats.halfDaysCount === 0) {
        return (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">Leaves Covered by Monthly Paid Leave</p>
                <p className="text-sm text-blue-700">
                  ✅ {Math.min(stats.leaveDaysCount, 1.5)} leave day(s) covered by monthly paid leave
                  {stats.leaveDaysCount === 0 && " (will carry forward)"}
                </p>
              </div>
            </div>
          </div>
        );
      }

      return null;
    }

    const getMessage = () => {
      const details = calculationDetails || {};

      if (details.new_carry_forward > 0) {
        const displayDays = details.new_carry_forward >= 1 
          ? `${Math.floor(details.new_carry_forward)} day(s)` 
          : `${details.new_carry_forward} half day(s)`;
        
        return {
          type: 'info',
          title: '🔄 Carry Forward Applied',
          message: `${displayDays} carried forward to next month.`,
          details: `Following exact salary rules: Unused PL/half days carry forward`
        };
      }
      else if (details.used_carry_forward > 0) {
        return {
          type: 'info',
          title: '📋 Previous Carry Forward Used',
          message: `${details.used_carry_forward} carry forward half day(s) used for adjustments.`,
          details: `Applied to unpaid leaves/half days before salary cut`
        };
      }
      else if (details.paid_leave_used > 0) {
        return {
          type: 'success',
          title: '✅ Monthly Paid Leave Applied',
          message: `${details.paid_leave_used} paid leave day(s) used from monthly allowance.`,
          details: 'First leave covered automatically each month'
        };
      }
      else if (details.salary_cut_days > 0) {
        return {
          type: 'warning',
          title: 'Salary Adjustment Applied',
          message: `${details.salary_cut_days} day(s) salary deduction for unadjusted time.`,
          details: 'After PL → Comp Off → Carry Forward adjustments'
        };
      }

      return {
        type: 'success',
        title: '✅ Full Salary Payable',
        message: 'All leaves and half days adjusted successfully.',
        details: 'No salary deductions this month'
      };
    };

    const message = getMessage();
    if (!message) return null;

    const bgColor = message.type === 'success' ? 'bg-green-50 border-green-200' :
      message.type === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200';

    const textColor = message.type === 'success' ? 'text-green-800' :
      message.type === 'warning' ? 'text-orange-800' : 'text-blue-800';

    return (
      <div className={`mb-6 p-4 ${bgColor} border rounded-lg`}>
        <div className="flex items-start gap-3">
          <InformationCircleIcon className={`h-5 w-5 ${textColor} flex-shrink-0 mt-0.5`} />
          <div>
            <p className={`text-sm font-semibold ${textColor} mb-1`}>{message.title}</p>
            <p className={`text-sm ${textColor}`}>{message.message}</p>
            <p className={`text-xs ${textColor} mt-1 opacity-80`}>{message.details}</p>

            {calculationDetails && (
              <div className={`text-xs ${textColor} mt-2 space-y-1`}>
                {calculationDetails.paid_leave_used > 0 && (
                  <p>• {calculationDetails.paid_leave_used} paid leave days used</p>
                )}
                {calculationDetails.comp_off_used > 0 && (
                  <p>• {calculationDetails.comp_off_used} comp off days used</p>
                )}
                {calculationDetails.used_carry_forward > 0 && (
                  <p>• {calculationDetails.used_carry_forward} carry forward half days used</p>
                )}
                {calculationDetails.unpaid_leave_used > 0 && (
                  <p>• {calculationDetails.unpaid_leave_used} unpaid leaves after adjustments</p>
                )}
                {calculationDetails.salary_cut_days > 0 && (
                  <p>• {calculationDetails.salary_cut_days} days salary cut applied</p>
                )}
                {calculationDetails.new_carry_forward > 0 && (
                  <p>• {calculationDetails.new_carry_forward >= 1 
                    ? `${Math.floor(calculationDetails.new_carry_forward)} day(s)` 
                    : `${calculationDetails.new_carry_forward} half day(s)`} carried forward</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Replace the SalaryBreakdown component with the new rules version
  const SalaryBreakdown = ({ currentSalaryData, employeeInfo }) => {
    if (!currentSalaryData) return null;

    const calculationDetails = currentSalaryData.calculation_details;
    const compOffInfo = currentSalaryData.comp_off_info;

    // ✅ Use per_day_salary from backend response (already calculated correctly)
    const perDaySalary = currentSalaryData.per_day_salary 
      ? Number(currentSalaryData.per_day_salary)
      : (currentSalaryData.total_days_in_month > 0 
          ? currentSalaryData.gross_monthly_salary / currentSalaryData.total_days_in_month
          : 0);
    
    console.log('💰 Salary Breakdown Debug:', {
      gross: currentSalaryData.gross_monthly_salary,
      total_days_in_month: currentSalaryData.total_days_in_month,
      total_working_days: currentSalaryData.total_working_days,
      per_day_salary_from_backend: currentSalaryData.per_day_salary,
      calculated_perDaySalary: perDaySalary,
      salary_cut_days: calculationDetails?.salary_cut_days,
      expected_cut: calculationDetails?.salary_cut_days * perDaySalary
    });

    let totalDeductions = 0;
    let deductionDetails = [];

    if (calculationDetails) {
      // ✅ NEW: Calculate deductions based on exact rules
      if (calculationDetails.salary_cut_days > 0) {
        const salaryCutAmount = calculationDetails.salary_cut_days * perDaySalary;
        totalDeductions += salaryCutAmount;
        deductionDetails.push({
          type: 'salary_cut',
          label: 'Salary Cut for Unadjusted Days',
          amount: salaryCutAmount,
          days: calculationDetails.salary_cut_days
        });
      }
    }

    const professionalTax = 200;
    totalDeductions += professionalTax;

    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-bold text-gray-900 mb-3">Salary Calculation Breakdown</h4>
        <div className="space-y-3">
          {/* Gross Salary */}
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-700">Gross Monthly Salary</span>
              <p className="text-xs text-gray-500">
                ₹{currentSalaryData.gross_monthly_salary?.toFixed(2)} ÷ {currentSalaryData.total_days_in_month || 31} days (per day: ₹{perDaySalary.toFixed(2)})
              </p>
            </div>
            <span className="font-bold text-green-600">
              ₹{currentSalaryData.gross_monthly_salary?.toFixed(2)}
            </span>
          </div>

          {/* ✅ NEW: Paid Leave Usage */}
          {calculationDetails?.paid_leave_used > 0 && (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
              <div>
                <span className="text-gray-700">Paid Leave Used</span>
                <p className="text-xs text-gray-500">
                  {calculationDetails.paid_leave_used} days of monthly paid leave
                </p>
              </div>
              <span className="font-bold text-green-600">
                ✅ Applied
              </span>
            </div>
          )}

          {/* Comp Off Usage */}
          {compOffInfo && compOffInfo.total_used > 0 && (
            <div className="flex justify-between items-center bg-blue-50 p-3 rounded border border-blue-200">
              <div>
                <span className="text-gray-700">Comp Off Used</span>
                <p className="text-xs text-gray-500">
                  {compOffInfo.total_used} days for leave/half day coverage
                </p>
              </div>
              <span className="font-bold text-blue-600">
                ✅ Applied
              </span>
            </div>
          )}

          {/* Carry Forward Usage */}
          {calculationDetails?.used_carry_forward > 0 && (
            <div className="flex justify-between items-center bg-purple-50 p-3 rounded border border-purple-200">
              <div>
                <span className="text-gray-700">Carry Forward Used</span>
                <p className="text-xs text-gray-500">
                  {calculationDetails.used_carry_forward} half day(s) from previous month
                </p>
              </div>
              <span className="font-bold text-purple-600">
                ✅ Applied
              </span>
            </div>
          )}

          {/* Salary Cut Deductions */}
          {deductionDetails.map((deduction, index) => (
            <div key={index} className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-200">
              <div>
                <span className="text-gray-700">{deduction.label}</span>
                <p className="text-xs text-gray-500">
                  {deduction.days} days × ₹{perDaySalary.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">
                  (Monthly ₹{currentSalaryData.gross_monthly_salary?.toFixed(2)} ÷ {currentSalaryData.total_days_in_month} days)
                </p>
              </div>
              <span className="font-bold text-red-600">
                -₹{deduction.amount.toFixed(2)}
              </span>
            </div>
          ))}

          {/* Professional Tax */}
          <div className="flex justify-between items-center border-t border-gray-300 pt-2">
            <span className="text-gray-700">Professional Tax</span>
            <span className="font-bold text-red-600">-₹200.00</span>
          </div>

          {/* Net Salary */}
          <div className="flex justify-between items-center border-t-2 border-gray-400 pt-2">
            <span className="text-lg font-bold text-gray-900">Net Salary Payable</span>
            <span className="text-xl font-bold text-green-600">
              ₹{Number(currentSalaryData.final_salary).toFixed(2)}
            </span>
          </div>

          {/* ✅ NEW: Carry Forward Message */}
          {calculationDetails?.new_carry_forward > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-700 font-medium mb-1">
                🔄 Carry Forward to Next Month
              </p>
              <p className="text-sm text-blue-600">
                • {calculationDetails.new_carry_forward >= 1 
                  ? `${Math.floor(calculationDetails.new_carry_forward)} day(s)` 
                  : `${calculationDetails.new_carry_forward} half day(s)`} carried forward
                {calculationDetails.available_paid_leaves_final > 0 && (
                  <span>, • {calculationDetails.available_paid_leaves_final} paid leave(s)</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SalarySlipDisplay = () => {
    if (!currentSalaryData) return null

    return (
      <Modal
        title="Salary Slip"
        open={showSalarySlip}
        onCancel={() => setShowSalarySlip(false)}
        width={750}
        centered
        footer={[
          <Button key="print" onClick={() => window.print()}>
            Print
          </Button>,
          <Button key="download" type="primary" onClick={handleDownloadPDF} loading={generatingPDF}>
            Download PDF
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid #f0f0f0' }}>
            <h2 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold' }}>Teople Technologies</h2>
            <h3 style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#1890ff' }}>SALARY SLIP - {getMonthName()} {year}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <p style={{ fontWeight: 500, marginBottom: '6px', fontSize: '12px' }}>Employee</p>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><span style={{ color: '#666' }}>ID:</span> <strong>{employeeInfo.id}</strong></div>
                <div><span style={{ color: '#666' }}>Name:</span> <strong>{employeeInfo.name}</strong></div>
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 500, marginBottom: '6px', fontSize: '12px' }}>Company</p>
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <div><strong>Teople Technologies</strong></div>
                <div style={{ fontSize: '11px', color: '#666' }}>Pimpri-Chinchwad, MH</div>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '6px 0' }} />

          <div>
            <p style={{ fontWeight: 500, marginBottom: '6px', fontSize: '12px' }}>Salary</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#f5f5f5', borderRadius: '3px', fontSize: '12px' }}>
                <span>Gross</span>
                <strong>₹{currentSalaryData.gross_monthly_salary?.toLocaleString()}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#f5f5f5', borderRadius: '3px', fontSize: '12px' }}>
                <span>Tax</span>
                <strong>-₹200</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f0f5ff', borderRadius: '3px', border: '1px solid #1890ff', fontWeight: 'bold', fontSize: '13px', gridColumn: '1 / -1' }}>
                <span>Net Payable</span>
                <span style={{ color: '#1890ff' }}>₹{Number(currentSalaryData.final_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <Divider style={{ margin: '6px 0' }} />

          <div>
            <p style={{ fontWeight: 500, marginBottom: '6px', fontSize: '12px' }}>Attendance</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: '4px' }}>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>Working</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.total_working_days}</div>
              </div>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>Present</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.present_days}</div>
              </div>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>Half</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.half_days || 0}</div>
              </div>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>Leave</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.leave_days || 0}</div>
              </div>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>WFH</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.wfh_days || 0}</div>
              </div>
              <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px', textAlign: 'center', fontSize: '11px' }}>
                <div style={{ color: '#666', fontSize: '10px' }}>Comp Off</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{currentSalaryData.comp_off_days || 0}</div>
              </div>
            </div>
          </div>

          {currentSalaryData.calculation_details && (
            <>
              <Divider style={{ margin: '6px 0' }} />
              <div>
                <p style={{ fontWeight: 500, marginBottom: '6px', fontSize: '12px' }}>Adjustments</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                  {currentSalaryData.calculation_details.paid_leave_used > 0 && (
                    <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px' }}>
                      <div style={{ color: '#666', fontSize: '11px' }}>Paid Leave</div>
                      <div style={{ fontWeight: 'bold' }}>{currentSalaryData.calculation_details.paid_leave_used} days</div>
                    </div>
                  )}
                  <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px' }}>
                    <div style={{ color: '#666', fontSize: '11px' }}>CF Used (Prev Month)</div>
                    <div style={{ fontWeight: 'bold' }}>{currentSalaryData.calculation_details.used_carry_forward || 0} days</div>
                  </div>
                  <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px' }}>
                    <div style={{ color: '#666', fontSize: '11px' }}>CF to Next Month</div>
                    <div style={{ fontWeight: 'bold' }}>{currentSalaryData.calculation_details.new_carry_forward || 0} days</div>
                  </div>
                  {currentSalaryData.calculation_details.salary_cut_days > 0 && (
                    <div style={{ padding: '6px', background: '#f5f5f5', borderRadius: '3px' }}>
                      <div style={{ color: '#666', fontSize: '11px' }}>Salary Cut</div>
                      <div style={{ fontWeight: 'bold' }}>{currentSalaryData.calculation_details.salary_cut_days} days</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', fontSize: '11px', color: '#999', paddingTop: '6px', borderTop: '1px solid #f0f0f0' }}>
            <p style={{ margin: '2px 0' }}>Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </Space>
      </Modal>
    )
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-lg text-gray-700 font-medium">Loading attendance data...</p>
        </div>
      </div>
    )
  }

  if (!employeeInfo.id) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-md border border-gray-200">
          <XCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Employee Not Found</h3>
          <p className="text-gray-600">Employee information is not available. Please check the URL and try again.</p>
        </div>
      </div>
    )
  }

  const stats = calculateWorkingStats()

  // Calculate previous month comparison
  const getPreviousMonthComparison = () => {
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    
    const prevRecord = salaryHistory.find(
      r => r.frontendMonth === prevMonth && r.year === prevYear
    )

    if (!prevRecord) {
      return null
    }

    return {
      workingDays: stats.workingDays - (prevRecord.total_working_days || 0),
      presentDays: stats.presentDaysCount - (prevRecord.present_days || 0),
      halfDays: stats.halfDaysCount - (prevRecord.half_days || 0),
      leaveDays: stats.leaveDaysCount - (prevRecord.leave_days || 0),
      wfhDays: stats.wfhDaysCount - (prevRecord.wfh_days || 0),
      compOffDays: stats.compOffDaysCount - (prevRecord.comp_off_days || 0),
      compOffUsed: (currentSalaryData?.comp_off_used || 0) - (prevRecord.comp_off_used || 0)
    }
  }

  const comparison = getPreviousMonthComparison()

  const formatComparison = (diff) => {
    if (diff === null || diff === undefined) return null
    if (diff === 0) return null // Don't show if no change
    const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : ''
    const absValue = Math.abs(diff)
    return { arrow, value: absValue, isPositive: diff > 0, isNegative: diff < 0 }
  }

  // Show comparison text even if no previous data (for testing)
  const showComparison = comparison !== null

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Employee Info Section - Clean horizontal layout */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        {/* Left: Avatar + Name + Role */}
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {employeeDetails?.profile_picture ? (
              <img
                src={employeeDetails.profile_picture}
                alt={employeeInfo.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-100"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-blue-100">
                <span className="text-white text-lg font-bold">
                  {employeeInfo.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{employeeInfo.name || '—'}</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              {employeeDetails?.role || employeeDetails?.designation || employeeDetails?.department || 'Employee'}
            </p>
          </div>
        </div>

        {/* Right: Details in horizontal row */}
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-xs text-gray-500 mb-1">Employee ID</p>
            <p className="text-sm font-semibold text-gray-900">{employeeInfo.id || '—'}</p>
          </div>
          
          <div className="w-px h-10 bg-gray-300"></div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="text-sm font-semibold text-gray-900">{employeeDetails?.phone || employeeDetails?.phone_number || '—'}</p>
          </div>
          
          <div className="w-px h-10 bg-gray-300"></div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Month</p>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={month}
              onChange={(e) => handleMonthChange(Number.parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2000, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Year</p>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={year}
              onChange={(e) => handleYearChange(Number.parseInt(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={year - 5 + i}>
                  {year - 5 + i}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-10 bg-gray-300"></div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Comp Off Balance</p>
            <p className="text-sm font-semibold text-gray-900">
              {Math.max(0, compOffBalance)}h <span className="text-gray-500 font-normal">({Math.max(0, Math.floor(compOffBalance / 9))} days)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards - Single border with vertical dividers */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 divide-x divide-gray-200">
          {/* Working Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Working Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.workingDays}</p>
            {comparison && formatComparison(comparison.workingDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.workingDays).isNegative ? 'text-orange-500' : 
                formatComparison(comparison.workingDays).isPositive ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.workingDays).arrow} {formatComparison(comparison.workingDays).value} in last month
              </p>
            )}
          </div>

          {/* Present Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Present Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.presentDaysCount}</p>
            {comparison && formatComparison(comparison.presentDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.presentDays).isNegative ? 'text-orange-500' : 
                formatComparison(comparison.presentDays).isPositive ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.presentDays).arrow} {formatComparison(comparison.presentDays).value} in last month
              </p>
            )}
          </div>

          {/* Half Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Half Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.halfDaysCount}</p>
            {comparison && formatComparison(comparison.halfDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.halfDays).isPositive ? 'text-orange-500' : 
                formatComparison(comparison.halfDays).isNegative ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.halfDays).arrow} {formatComparison(comparison.halfDays).value} in last month
              </p>
            )}
          </div>

          {/* Leave Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Leave Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.leaveDaysCount}</p>
            {comparison && formatComparison(comparison.leaveDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.leaveDays).isPositive ? 'text-orange-500' : 
                formatComparison(comparison.leaveDays).isNegative ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.leaveDays).arrow} {formatComparison(comparison.leaveDays).value} in last month
              </p>
            )}
          </div>

          {/* WFH Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">WFH Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.wfhDaysCount}</p>
            {comparison && formatComparison(comparison.wfhDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.wfhDays).isPositive ? 'text-blue-500' : 
                formatComparison(comparison.wfhDays).isNegative ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.wfhDays).arrow} {formatComparison(comparison.wfhDays).value} in last month
              </p>
            )}
          </div>

          {/* Comp Off Days */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Comp Off Days</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{stats.compOffDaysCount}</p>
            {comparison && formatComparison(comparison.compOffDays) && (
              <p className={`text-xs ${
                formatComparison(comparison.compOffDays).isPositive ? 'text-blue-500' : 
                formatComparison(comparison.compOffDays).isNegative ? 'text-orange-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.compOffDays).arrow} {formatComparison(comparison.compOffDays).value} in last month
              </p>
            )}
          </div>

          {/* Comp Off Used */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Comp Off Used</p>
            <p className="text-2xl font-bold text-gray-900 mb-1">{currentSalaryData?.comp_off_used || 0}</p>
            {comparison && formatComparison(comparison.compOffUsed) && (
              <p className={`text-xs ${
                formatComparison(comparison.compOffUsed).isPositive ? 'text-orange-500' : 
                formatComparison(comparison.compOffUsed).isNegative ? 'text-blue-500' : 'text-gray-400'
              }`}>
                {formatComparison(comparison.compOffUsed).arrow} {formatComparison(comparison.compOffUsed).value} in last month
              </p>
            )}
          </div>

          {/* Late Mark - present days with <9 hours */}
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-2">Late Mark</p>
            <p className="text-2xl font-bold text-yellow-600 mb-1">
              {attendanceData.filter(d =>
                d && !d.isWeekend && !d.isOnLeave && !d.isOnWFH && !d.isOnCompOff &&
                d.present && d.status !== 'half_day' &&
                d.totalHours && parseFloat(d.totalHours) < 9
              ).length}
            </p>
            <p className="text-xs text-gray-400">Days &lt;9 hrs</p>
          </div>

          {/* Carry Forward - latest unspent CF */}
          {(() => {
            const sorted = [...salaryHistory].sort((a, b) =>
              a.year !== b.year ? a.year - b.year : a.frontendMonth - b.frontendMonth
            )
            // Find last record that has new_carry_forward > 0 and is not used after it
            let cfRecord = null
            for (let i = sorted.length - 1; i >= 0; i--) {
              const record = sorted[i]
              if ((record.new_carry_forward || 0) > 0) {
                // Check if any later month used it
                const usedLater = sorted.slice(i + 1).some(r => (r.used_carry_forward || 0) > 0)
                if (!usedLater) { cfRecord = record; break }
              }
            }
            const cfValue = cfRecord?.new_carry_forward || 0
            const cfLabel = cfRecord
              ? new Date(cfRecord.year, cfRecord.frontendMonth).toLocaleString('default', { month: 'short' }) + ' ' + cfRecord.year
              : null
            return (
              <div className="p-4">
                <p className="text-xs text-gray-500 mb-2">Carry Fwd</p>
                <p className="text-2xl font-bold text-purple-600 mb-1">{cfValue}</p>
                <p className="text-xs text-gray-400">{cfLabel ? `From ${cfLabel}` : 'No CF yet'}</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Attendance Calendar Table */}
      <div className="bg-white p-6 mb-6">
        <div className="flex flex-wrap gap-3 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-200 border border-emerald-400 rounded"></div>
            <span className="text-gray-700">Present (≥9h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-400 rounded"></div>
            <span className="text-gray-700">&lt;9 Hours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
            <span className="text-gray-700">Direct Half Day (&lt;7h)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-orange-200 border border-orange-400 rounded"></div>
            <span className="text-gray-700">Half Day (4th time)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-200 border border-purple-500 rounded"></div>
            <span className="text-gray-700">Admin Covered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-200 border border-amber-400 rounded"></div>
            <span className="text-gray-700">Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-violet-200 border border-violet-400 rounded"></div>
            <span className="text-gray-700">WFH</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-sky-200 border border-sky-400 rounded"></div>
            <span className="text-gray-700">Comp Off</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-200 border border-green-400 rounded"></div>
            <span className="text-gray-700">Paid Saturday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
            <span className="text-gray-700">Working Saturday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-purple-200 border border-purple-400 rounded"></div>
            <span className="text-gray-700">Company Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-slate-200 border border-slate-400 rounded"></div>
            <span className="text-gray-700">Sunday</span>
          </div>
        </div>

        {/* Compact Table View */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 w-24">Date</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 w-12">Day</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 w-36">Status</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Clock-in & Out</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200 w-28">Overtime</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceData.filter(d => d).map((day, idx) => {
                const index = attendanceData.indexOf(day);
                const isSundayCompOff = day.isOnCompOff && new Date(day.date).getDay() === 0;
                const isMuted = (day.isWeekend && !isSundayCompOff) || day.isOnLeave || day.isOnWFH || (day.isOnCompOff && !isSundayCompOff) || day.isCompanyLeave;
                const canEdit = !isMuted && !isSundayCompOff;

                const statusBadge = (() => {
                  if (day.isCompanyLeave) return { label: 'Company Leave', cls: 'bg-purple-100 text-purple-700' };
                  if (day.isOnCompOff) return { label: 'Comp Off', cls: 'bg-sky-100 text-sky-700' };
                  if (day.isOnLeave)   return { label: 'Leave',     cls: 'bg-amber-100 text-amber-700' };
                  if (day.isOnWFH)    return { label: 'WFH',       cls: 'bg-violet-100 text-violet-700' };
                  if (day.isWeekend) {
                    const d = new Date(day.date);
                    if (d.getDay() === 6) {
                      const wk = Math.ceil(d.getDate() / 7);
                      const isPaid = saturdayOverrides[day.date]
                        ? saturdayOverrides[day.date] === 'off'
                        : (wk === 2 || wk === 4);
                      return isPaid
                        ? { label: 'Paid Saturday', cls: 'bg-green-100 text-green-700' }
                        : { label: 'Working Sat', cls: 'bg-blue-100 text-blue-700' };
                    }
                    return { label: 'Sunday', cls: 'bg-slate-100 text-slate-600' };
                  }
                  if ((day.status === 'present' && day.admin_covered) || managedHalfDays.has(day.date))
                    return { label: 'Admin Covered', cls: 'bg-purple-100 text-purple-700' };
                  if (day.status === 'half_day')
                    return parseFloat(day.totalHours) < 7
                      ? { label: 'Half Day (<7h)', cls: 'bg-red-100 text-red-700' }
                      : { label: 'Half Day (4th)', cls: 'bg-orange-100 text-orange-700' };
                  if (day.totalHours && parseFloat(day.totalHours) < 9 && day.present)
                    return { label: 'Present (<9h)', cls: 'bg-yellow-100 text-yellow-700' };
                  if (day.present) return { label: 'Present', cls: 'bg-emerald-100 text-emerald-700' };
                  return { label: 'Absent', cls: 'bg-gray-100 text-gray-500' };
                })();

                const hoursBadge = (() => {
                  if (!day.totalHours) return null;
                  const h = parseFloat(day.totalHours);
                  if (day.status === 'half_day')
                    return h < 7 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
                  if (h < 9) return 'bg-yellow-100 text-yellow-700';
                  return 'bg-emerald-100 text-emerald-700';
                })();

                return (
                  <tr key={day.date} className={isMuted ? 'bg-gray-50 opacity-70' : 'bg-white hover:bg-blue-50/30'}>
                    {/* Date */}
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap text-center">
                      {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    {/* Day */}
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-center">{day.day}</td>
                    {/* Status */}
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    {/* Clock-in & Out */}
                    <td className="px-3 py-2">
                      {canEdit ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="time"
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 text-center"
                            value={day.inTime12h}
                            onChange={(e) => handleTimeChange(index, 'inTime12h', e.target.value)}
                            step="300"
                          />
                          <span className="text-gray-400 text-xs">•••</span>
                          <span className="text-gray-600 text-xs font-medium min-w-[50px]">{day.totalHours ? formatDecimalHours(parseFloat(day.totalHours)) : ''}</span>
                          <span className="text-gray-400 text-xs">•••</span>
                          <input
                            type="time"
                            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 text-center"
                            value={day.outTime12h}
                            onChange={(e) => handleTimeChange(index, 'outTime12h', e.target.value)}
                            step="300"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs flex justify-center">—</span>
                      )}
                    </td>
                    {/* Overtime */}
                    <td className="px-3 py-2 text-center">
                      {day.totalHours && parseFloat(day.totalHours) > 9 ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {formatDecimalHours(parseFloat(day.totalHours) - 9)}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    {/* Action */}
                    <td className="px-3 py-2 text-center">
                      {canEdit && (
                        <Button
                          onClick={() => handleHalfDayToggle(index)}
                          size="small"
                          style={{
                            borderColor: day.status === 'half_day' ? '#ef4444' : '#000',
                            color: day.status === 'half_day' ? '#ef4444' : '#000',
                          }}
                        >
                          {day.status === 'half_day' ? '½ Undo' : 'Half Day'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      <CarryForwardMessage />

      {/* Salary Generation Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <Button
          onClick={calculateSalary}
          size="large"
        >
          Generate Salary for {getMonthName()} {year}
        </Button>
        
        {stats.halfDaysCount > 0 && (
          <Button
            onClick={() => setShowHalfDayModal(true)}
            size="large"
          >
            Cover Half Days ({stats.halfDaysCount})
          </Button>
        )}
      </div>

      {/* ✅ REMOVED: No longer showing modal - automatic adjustment */}
      {false && showCompOffDialog && (() => {
        const effectiveHalfDays = stats.halfDaysCount - managedHalfDays.size;
        const monthlyPaidLeave = 1.5; // ✅ Company policy: 1.5 days per month
        const unpaidLeaves = Math.max(0, stats.leaveDaysCount - monthlyPaidLeave);
        
        // Get previous carry forward
        const getPreviousCarryForward = () => {
          const prevMonth = month === 0 ? 11 : month - 1;
          const prevYear = month === 0 ? year - 1 : year;
          const prevRecord = salaryHistory.find(
            r => r.frontendMonth === prevMonth && r.year === prevYear
          );
          // Only use new_carry_forward, not fallback values
          return prevRecord?.new_carry_forward || 0;
        };
        
        const previousCarryForward = getPreviousCarryForward();
        const availableCompOffDays = Math.floor(compOffBalance / 9);
        
        return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Comp Off Usage</h3>
                  <p className="text-blue-100 text-xs opacity-90">{getMonthName()} {year}</p>
                </div>
                <button
                  onClick={() => setShowCompOffDialog(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-all duration-200"
                >
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Show only if comp off available */}
              {availableCompOffDays > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-900 text-sm">Comp Off Balance</h4>
                      <p className="text-xs text-green-700">Available for adjustment</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xl font-bold text-green-700">{compOffBalance} hours</p>
                    <p className="text-sm text-gray-600">({availableCompOffDays} full days available)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Days to Use:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={availableCompOffDays}
                      value={compOffToUse}
                      onChange={(e) => {
                        const value = Math.min(Math.max(0, Number(e.target.value) || 0), availableCompOffDays);
                        setCompOffToUse(value);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Show only if carry forward available */}
              {previousCarryForward > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 text-sm">Previous Month Carry Forward</h4>
                      <p className="text-xs text-purple-700">Available from previous month</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xl font-bold text-purple-700">{previousCarryForward} half days</p>
                    <p className="text-sm text-gray-600">Available from previous month</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Half Days to Use:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={previousCarryForward}
                      step="0.5"
                      value={carryForwardToUse}
                      onChange={(e) => {
                        const value = Math.min(Math.max(0, Number(e.target.value) || 0), previousCarryForward);
                        setCarryForwardToUse(value);
                      }}
                      className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Show covered half days if any */}
              {managedHalfDays.size > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 text-sm">Admin Covered Half Days</h4>
                      <p className="text-xs text-blue-700">Treated as full present</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-xl font-bold text-blue-700">{managedHalfDays.size}</p>
                    <p className="text-sm text-gray-600">Half days covered by admin</p>
                  </div>
                </div>
              )}

              {/* Decision */}
              <div className="space-y-3">
                <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-green-400 transition-all duration-200">
                  <input
                    type="radio"
                    name="salaryMethod"
                    value="with_comp_off"
                    checked={salaryCalculationMethod === "with_comp_off"}
                    onChange={(e) => setSalaryCalculationMethod(e.target.value)}
                    className="w-4 h-4 text-green-600 mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Use Adjustments</p>
                      <p className="text-xs text-gray-600">
                        {compOffToUse > 0 || carryForwardToUse > 0 
                          ? (
                            <>
                              {compOffToUse > 0 && `${compOffToUse} comp off days`}
                              {compOffToUse > 0 && carryForwardToUse > 0 && " + "}
                              {carryForwardToUse > 0 && `${carryForwardToUse} carry forward half days`}
                            </>
                          )
                          : "Select values above to use adjustments"
                        }
                      </p>
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-red-400 transition-all duration-200">
                  <input
                    type="radio"
                    name="salaryMethod"
                    value="without_comp_off"
                    checked={salaryCalculationMethod === "without_comp_off"}
                    onChange={(e) => setSalaryCalculationMethod(e.target.value)}
                    className="w-4 h-4 text-red-600 mr-3"
                  />
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">No Adjustments</p>
                      <p className="text-xs text-gray-600">Deduct salary for unpaid leaves</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompOffDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white font-medium transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompOffConfirmation}
                  disabled={salaryCalculationMethod === "with_comp_off" && compOffToUse === 0 && carryForwardToUse === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Calculate Salary
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {isGenerated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3 md:mb-0">
              Salary Generated Successfully for {getMonthName()} {year}!
            </h3>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowSalarySlip(true)}
              >
                View Salary Slip
              </Button>
            </div>
          </div>

          {currentSalaryData?.calculation_details && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-lg font-bold text-blue-900 mb-3">Comp Off & Carry Forward Adjustment</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-blue-700 font-medium">Previous Carry Forward</p>
                  <p className="text-gray-900 font-bold">
                    {currentSalaryData.calculation_details.calculation_steps?.available_carry_forward || 0} Half Days
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-green-700 font-medium">Available Comp Off</p>
                  <p className="text-gray-900 font-bold">
                    {currentSalaryData.calculation_details.calculation_steps?.available_comp_off || 0} Days
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-orange-700 font-medium">Used This Month</p>
                  <p className="text-gray-900 font-bold">
                    {currentSalaryData.calculation_details.total_comp_off_used || 0} Comp Off + {currentSalaryData.calculation_details.used_carry_forward || 0} Carry Forward
                  </p>
                  <p className="text-gray-600 text-xs">
                    {currentSalaryData.calculation_details.comp_off_used_for_half_days || 0} for half days + {currentSalaryData.calculation_details.comp_off_used_for_leaves || 0} for leaves
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="text-purple-700 font-medium">New Carry Forward</p>
                  <p className="text-gray-900 font-bold">
                    {currentSalaryData.calculation_details.new_carry_forward || 0} Half Days
                  </p>
                  <p className="text-gray-600 text-xs">
                    To next month
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded border border-blue-300">
                <p className="text-blue-800 text-sm font-medium">Adjustment Details:</p>
                <p className="text-blue-700 text-xs">
                  • {currentSalaryData.calculation_details.comp_off_used_for_half_days || 0} comp off days used for half days
                  <br />
                  • {currentSalaryData.calculation_details.comp_off_used_for_leaves || 0} comp off days used for regular leaves
                  <br />
                  • {currentSalaryData.calculation_details.used_carry_forward || 0} carry forward half days used
                  <br />
                  • {currentSalaryData.calculation_details.new_carry_forward >= 1 
                    ? `${Math.floor(currentSalaryData.calculation_details.new_carry_forward)} day(s)` 
                    : `${currentSalaryData.calculation_details.new_carry_forward || 0} half day(s)`} carried forward
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-1">Gross Monthly Salary</p>
              <p className="font-bold text-lg text-gray-900">₹{employeeInfo.monthlySalary?.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium mb-1">Professional Tax</p>
              <p className="font-bold text-lg text-gray-900">₹200.00</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">Present Days</p>
              <p className="font-bold text-lg text-gray-900">{presentDays}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-700 font-medium mb-1">Net Salary</p>
              <p className="font-bold text-lg text-gray-900">₹{Number(currentSalaryData?.final_salary || finalSalary).toFixed(2)}</p>
            </div>
          </div>

          <SalaryBreakdown
            currentSalaryData={currentSalaryData}
            employeeInfo={employeeInfo}
          />
        </div>
      )}

      {/* Salary History Section */}
      <div className="bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2 md:mb-0">Salary Generation History</h3>
          <p className="text-gray-600 text-sm">
            {salaryHistory.length} record{salaryHistory.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loadingHistory ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Loading salary records...</p>
          </div>
        ) : salaryHistory.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600">No salary records found for this employee.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Working Days</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Present</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Half Days</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Leave</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">WFH</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Comp Off</th>
                  {/* ✅ NEW HEADERS */}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">PL Used</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Unpaid Leaves</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Salary Cut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Final Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Generated On</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-200">Salary Slip</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salaryHistory.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-100">
                      {record.displayMonth}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.year}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.total_working_days}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.present_days}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.half_days || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.leave_days || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.wfh_days || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">{record.comp_off_days || 0}</td>

                    {/* ✅ NEW FIELDS */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">
                      {record.paid_leave_used || 0} days
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">
                      {record.unpaid_leave_used || 0} days
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">
                      {record.salary_cut_days || 0} days
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-emerald-600 border border-gray-100">
                      ₹{Number(record.final_salary).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border border-gray-100">
                      {new Date(record.generated_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm border border-gray-100">
                      <Button
                        onClick={() => handleDownloadMonthlyPDF(employeeInfo.id, record.frontendMonth, record.year)}
                        size="small"
                        title="Download Salary Slip"
                      >
                        PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSalarySlip && <SalarySlipDisplay />}
      
      {/* Error/Success Card */}
      <ErrorCard
        type={errorCard.type}
        title={errorCard.title}
        message={errorCard.message}
        description={errorCard.description}
        buttonText={errorCard.buttonText}
        visible={errorCard.visible}
        onButtonClick={errorCard.onButtonClick}
        onClose={() => setErrorCard({ ...errorCard, visible: false })}
      />
      
      {/* Professional Half Day Management Modal */}
      <Modal
        title="Half Day Management"
        open={showHalfDayModal}
        onCancel={() => setShowHalfDayModal(false)}
        width={600}
        centered
        footer={[
          <Button key="cancel" onClick={() => {
            setManagedHalfDays(new Set());
            setShowHalfDayModal(false);
          }}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={managedHalfDays.size === 0}
            onClick={async () => {
              if (managedHalfDays.size > 0) {
                toast.loading('Saving covered half days...');
                
                for (const dateStr of managedHalfDays) {
                  try {
                    await updateAttendance({
                      employee_id: employeeInfo.id,
                      date: dateStr,
                      in_time: '09:00',
                      out_time: '18:00',
                      status: 'present',
                      total_hours: '9.00',
                      admin_covered: true,
                      admin_cover_reason: `Half day covered by admin for salary calculation on ${new Date().toLocaleDateString()}`
                    });
                  } catch (err) {
                    console.error(`Failed to save ${dateStr}:`, err);
                  }
                }
                
                await loadAttendanceWithLeaves();
                toast.dismiss();
                toast.success(`${managedHalfDays.size} half days covered and saved successfully!`);
              }
              
              setShowHalfDayModal(false);
            }}
          >
            Save {managedHalfDays.size > 0 ? `${managedHalfDays.size} Days` : 'Days'}
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <p style={{ marginBottom: '8px', fontWeight: 500 }}>Summary</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Total Half Days</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.halfDaysCount}</div>
              </div>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Admin Covered</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{managedHalfDays.size}</div>
              </div>
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Remaining</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{stats.halfDaysCount - managedHalfDays.size}</div>
              </div>
            </div>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          <div>
            <p style={{ marginBottom: '12px', fontWeight: 500 }}>Select Half Days to Cover</p>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {attendanceData
                .filter(day => day && day.status === 'half_day')
                .map((day) => {
                  const dateKey = day.date;
                  const isManaged = managedHalfDays.has(dateKey);
                  
                  return (
                    <div
                      key={dateKey}
                      onClick={() => {
                        const newManaged = new Set(managedHalfDays);
                        if (isManaged) {
                          newManaged.delete(dateKey);
                        } else {
                          newManaged.add(dateKey);
                        }
                        setManagedHalfDays(newManaged);
                      }}
                      style={{
                        padding: '10px 12px',
                        marginBottom: '8px',
                        border: isManaged ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: isManaged ? '#f0f5ff' : '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Hours: {day.totalHours ? formatDecimalHours(parseFloat(day.totalHours)) : 'N/A'}
                        </div>
                      </div>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '2px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: isManaged ? '#1890ff' : '#f5f5f5',
                        color: isManaged ? '#fff' : '#666'
                      }}>
                        {isManaged ? '✓ Covered' : 'Half Day'}
                      </div>
                    </div>
                  );
                })
              }
              
              {attendanceData.filter(day => day && day.status === 'half_day').length === 0 && (
                <Empty description="No half days found" />
              )}
            </div>
          </div>
        </Space>
      </Modal>

    </div>
  )
}

export default SalaryAttendance

export const SalaryAttendanceRoute = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  return (
    <SalaryAttendance
      routeId={id}
      routeSearchParams={searchParams}
      employeeName={searchParams.get("name")}
      employeeMonthlySalary={searchParams.get("monthlySalary")}
    />
  )
}