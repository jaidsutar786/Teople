import { useState, useEffect } from "react"
import { getSalaries, addSalary, updateSalary, deleteSalary, getEmployees, updateAttendance, sendCompOffUsageNotifications, getAttendanceWithLeaves, calculateMonthlySalary, getMonthlySalaryHistory, getAllEmployeesBankDetails } from "../api"
import { MagnifyingGlassIcon, XMarkIcon, ArrowUpTrayIcon } from "@heroicons/react/24/outline"
import * as XLSX from 'xlsx'
import { toast } from 'react-hot-toast'
import SalaryAttendance from "./SalaryCreate"
import { Modal, Button } from 'antd'
import ErrorCard from './ErrorCard'

const SalaryManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false)
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false)
  const [bulkUploadMonth, setBulkUploadMonth] = useState(new Date().getMonth() + 1)
  const [bulkUploadYear, setBulkUploadYear] = useState(new Date().getFullYear())
  const [bulkUploading, setBulkUploading] = useState(false)
  const [drawerEmployee, setDrawerEmployee] = useState(null)
  const [salaries, setSalaries] = useState([])
  const [employeeList, setEmployeeList] = useState([])
  const [formData, setFormData] = useState({
    employee: "",
    gross_annual_salary: "",
    actual_variable_pay: "",
    financial_year: "2025-26",
  })
  const [excelMonth, setExcelMonth] = useState(new Date().getMonth() + 1)
  const [excelYear, setExcelYear] = useState(new Date().getFullYear())
  const [search, setSearch] = useState("")
  const [notifSending, setNotifSending] = useState(false)
  const [bulkGenerating, setBulkGenerating] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [employeeAttendance, setEmployeeAttendance] = useState({})
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [generatedSalaries, setGeneratedSalaries] = useState({})
  const [errorCard, setErrorCard] = useState({ visible: false, type: 'error', title: '', message: '', description: '', buttonText: 'OK', onButtonClick: () => {} })

  useEffect(() => {
    loadSalaries()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (salaries.length > 0) {
      loadAllEmployeeAttendance()
      loadGeneratedSalaries()
    }
  }, [salaries, selectedMonth, selectedYear])

  const loadGeneratedSalaries = async () => {
    const generatedMap = {}

    for (const salary of salaries) {
      try {
        const history = await getMonthlySalaryHistory(salary.employee)
        const hasGenerated = history.some(record =>
          record.month === selectedMonth && record.year === selectedYear
        )

        if (hasGenerated) {
          const record = history.find(r => r.month === selectedMonth && r.year === selectedYear)
          generatedMap[salary.employee] = {
            generated: true,
            finalSalary: record?.final_salary || 0
          }
        } else {
          generatedMap[salary.employee] = {
            generated: false,
            finalSalary: 0
          }
        }
      } catch (err) {
        console.error(`Failed to check salary for employee ${salary.employee}:`, err)
        generatedMap[salary.employee] = {
          generated: false,
          finalSalary: 0
        }
      }
    }

    setGeneratedSalaries(generatedMap)
  }

  const loadAllEmployeeAttendance = async () => {
    const attendanceMap = {}

    for (const salary of salaries) {
      try {
        const data = await getAttendanceWithLeaves(salary.employee, selectedMonth - 1, selectedYear)
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()

        let workingDays = 0
        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(selectedYear, selectedMonth - 1, i)
          const day = date.getDay()
          if (day === 0) continue
          if (day === 6) {
            const weekNum = Math.ceil(i / 7)
            if (weekNum === 2 || weekNum === 4) continue
          }
          workingDays++
        }

        attendanceMap[salary.employee] = {
          workingDays,
          presentDays: data.attendance_records?.filter(r => r.status === 'present').length || 0,
          halfDays: data.attendance_records?.filter(r => r.status === 'half_day').length || 0,
          leaveDays: data.leave_dates?.length || 0,
          wfhDays: data.wfh_dates?.length || 0,
          compOffDays: data.comp_off_dates?.length || 0
        }
      } catch (err) {
        console.error(`Failed to load attendance for employee ${salary.employee}:`, err)
        attendanceMap[salary.employee] = {
          workingDays: 0,
          presentDays: 0,
          halfDays: 0,
          leaveDays: 0,
          wfhDays: 0,
          compOffDays: 0
        }
      }
    }

    setEmployeeAttendance(attendanceMap)
  }

  const loadSalaries = async () => {
    try {
      const data = await getSalaries()
      const sortedData = data.sort((a, b) => {
        const idA = parseInt(String(a.emp_code ?? '').replace('EMP', '') || 0)
        const idB = parseInt(String(b.emp_code ?? '').replace('EMP', '') || 0)
        return idA - idB
      })
      setSalaries(sortedData)
    } catch (err) {
      console.error("Error fetching salaries:", err)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await getEmployees()
      setEmployeeList(data)
    } catch (err) {
      console.error("Error fetching employees:", err)
    }
  }

  const handleAddSalary = async (e) => {
    e.preventDefault()
    try {
      await addSalary(formData)
      setIsAddModalOpen(false)
      resetForm()
      loadSalaries()
    } catch (err) {
      console.error("Error adding salary:", err)
    }
  }

  const handleDeleteSalary = async (id) => {
    try {
      await deleteSalary(id)
      loadSalaries()
    } catch (err) {
      console.error("Error deleting salary:", err)
    }
  }

  const handleUpdateSalary = async (e) => {
    e.preventDefault()
    try {
      await updateSalary(formData.id, formData)
      setIsEditModalOpen(false)
      resetForm()
      loadSalaries()
    } catch (err) {
      console.error("Error updating salary:", err)
    }
  }

  const resetForm = () => {
    setFormData({
      employee: "",
      gross_annual_salary: "",
      actual_variable_pay: "",
      financial_year: "2025-26",
    })
  }

  const openDetailsDrawer = (salary) => {
    setDrawerEmployee({
      id: salary.employee,
      name: salary.employee_name,
      monthlySalary: salary.monthly_salary,
    })
  }

  const filteredSalaries = salaries.filter(s => {
    const name = (s.employee_name ?? "").toLowerCase()
    const code = String(s.emp_code ?? "").toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || code.includes(q)
  })

  const handleDownloadExcel = async () => {
    try {
      // Fetch all employees bank details
      let bankDetailsMap = {}
      try {
        const allBankData = await getAllEmployeesBankDetails()
        const list = allBankData.results ?? allBankData
        list.forEach(emp => {
          const info = emp.personal_info
          if (!info) return
          bankDetailsMap[emp.employee.id] = {
            accountNumber: info.account_number || '',
            ifscCode: info.ifsc_code || '',
            accountHolderName: info.account_holder_name || ''
          }
        })
      } catch (e) {
        console.warn('Could not fetch bank details:', e)
      }

      const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][selectedMonth - 1]

      // Cheque date = today
      const today = new Date()
      const chequeDate = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`

      const DEBIT_ACC = '2266102000001290'
      const AC_CODE = '10'

      const dataRows = filteredSalaries.map((salary, index) => {
        const salaryStatus = generatedSalaries[salary.employee] || { generated: false, finalSalary: 0 }
        const bank = bankDetailsMap[salary.employee] || {}
        return [
          index + 1,
          salaryStatus.generated ? Number(salaryStatus.finalSalary) : '',
          DEBIT_ACC,
          bank.ifscCode || '',
          bank.accountNumber || '',
          AC_CODE,
          bank.accountHolderName || salary.employee_name || '',
          'Teople Technologies'
        ]
      })

      const totalAmount = filteredSalaries.reduce((sum, s) => {
        const st = generatedSalaries[s.employee]
        return sum + (st?.generated ? Number(st.finalSalary) : 0)
      }, 0)

      const wsData = [
        ['Sr No', 'Amount', 'Debit Acc Number', 'IFSC Code', 'Benf Acc Number', 'A/C Code', 'Beneficiary Name', 'Sender Name'],
        ...dataRows,
        [],
        ['', 'TOTAL', totalAmount, '', '', '', '', ''],
        [],
        [`CHEQUE DATE : ${chequeDate}`],
        [],
        ['For Sender to receiver Info field, you can mention purpose of payment / remarks'],
        [],
        ['Firm name :', 'Teople Technologies'],
        ['Account no :', '2266102000001298'],
        ['Service outlet :', '2266'],
        ['Part trans type :', 'D'],
        ['IFSC CODE :', 'IBKL0002266'],
        ['Customer Id :', '103300606'],
      ]

      const ws = XLSX.utils.aoa_to_sheet(wsData)

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Salary')
      XLSX.writeFile(wb, `Salary_Report_${monthName}_${selectedYear}.xlsx`)
    } catch (error) {
      console.error('Error generating Excel:', error)
      toast.error('Failed to generate Excel file')
    }
  }

  const handleSendCompOffNotifications = async () => {
    setNotifSending(true)
    setNotifResult(null)
    try {
      const now = new Date()
      const data = await sendCompOffUsageNotifications(now.getMonth() + 1, now.getFullYear())
      setErrorCard({
        visible: true, type: 'success', title: 'NOTIFICATIONS SENT',
        message: `Sent to ${data.sent_to?.length || 0} employees`,
        description: 'Comp off usage notifications sent successfully.',
        buttonText: 'OK', onButtonClick: () => {}
      })
    } catch (e) {
      setErrorCard({
        visible: true, type: 'error', title: 'FAILED',
        message: 'Could not send notifications.',
        description: e?.response?.data?.error || 'Please try again.',
        buttonText: 'Try Again', onButtonClick: () => {}
      })
    } finally {
      setNotifSending(false)
    }
  }

  const handleBulkSalaryGenerate = async () => {
    setBulkGenerating(true)
    setBulkResult(null)

    let successCount = 0
    let failedCount = 0
    let skippedCount = 0
    const failedEmployees = []

    // Sirf wo employees jinki salary is month generate nahi hui
    const pendingSalaries = salaries.filter(s => !generatedSalaries[s.employee]?.generated)

    console.log(`🚀 Starting bulk salary generation for ${pendingSalaries.length} pending employees (${salaries.length - pendingSalaries.length} already generated)...`)
    skippedCount = salaries.length - pendingSalaries.length

    if (pendingSalaries.length === 0) {
      setBulkGenerating(false)
      setErrorCard({
        visible: true, type: 'error', title: 'ALREADY GENERATED',
        message: `Salary already generated for ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][selectedMonth-1]} ${selectedYear}.`,
        description: 'All employees salary is already created for this month.',
        buttonText: 'OK', onButtonClick: () => {}
      })
      return
    }

    toast.loading(`Generating salary for ${pendingSalaries.length} pending employees...`)

    for (const salary of pendingSalaries) {
      try {
        console.log(`⏳ Generating salary for ${salary.employee_name} (${salary.emp_code})...`)
        await calculateMonthlySalary({
          employee_id: salary.employee,
          month: selectedMonth,
          year: selectedYear
        })
        successCount++
        console.log(`✅ Success: ${salary.employee_name}`)
      } catch (err) {
        failedCount++
        failedEmployees.push(salary.employee_name || salary.employee)
        console.error(`❌ Failed to generate salary for ${salary.employee_name}:`, err)
      }
    }

    toast.dismiss()

    console.log(`\n📊 Bulk Salary Generation Complete!`)
    console.log(`Total: ${salaries.length} | Success: ${successCount} | Failed: ${failedCount}`)
    if (failedCount > 0) {
      console.log(`Failed Employees:`, failedEmployees)
    }

    // Immediately reload generated salaries data
    await loadGeneratedSalaries()

    setBulkResult({
      success: failedCount === 0,
      total: salaries.length,
      pending: pendingSalaries.length,
      skippedCount,
      successCount,
      failedCount,
      failedEmployees
    })
    setBulkGenerating(false)

    setTimeout(() => {
      setBulkResult(null)
    }, 5000)
  }

  const handleBulkAttendanceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploadingExcel(true)
    const loadingToast = toast.loading('📊 Reading Excel file...')

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true })

      const parseAllTimes = (cellVal) => {
        if (!cellVal) return []
        if (typeof cellVal === 'number') {
          const totalMinutes = Math.round(cellVal * 24 * 60)
          const h = Math.floor(totalMinutes / 60) % 24
          const m = totalMinutes % 60
          return [`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`]
        }
        const matches = String(cellVal).match(/(\d{1,2}):(\d{2})/g) || []
        return matches.map(t => {
          const [h, m] = t.split(':')
          return `${h.padStart(2, '0')}:${m}`
        })
      }

      const isDayNum = (val) => {
        if (typeof val === 'number') return val >= 1 && val <= 31
        if (typeof val === 'string') { const n = parseInt(val); return !isNaN(n) && n >= 1 && n <= 31 }
        return false
      }
      const getDayNum = (val) => typeof val === 'number' ? val : parseInt(val)

      let totalUpdated = 0
      let totalSkipped = 0
      let employeesProcessed = 0

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i]
        if (!row) continue

        let empId = null
        let empName = null
        for (let col = 0; col < row.length; col++) {
          if (row[col] === 'UserID:') empId = String(row[col + 1] ?? '')
          if (row[col] === 'Name:') empName = String(row[col + 1] ?? '')
        }
        if (!empId && !empName) continue

        const salaryRecord = salaries.find(s => {
          if (empId && String(s.employee) === empId) return true
          if (empName && s.employee_name?.toLowerCase().includes(empName.toLowerCase())) return true
          return false
        })
        if (!salaryRecord) continue

        let dateRowIdx = -1
        let dateStartCol = 0
        for (let r = i + 1; r <= i + 3; r++) {
          const candidate = jsonData[r]
          if (!candidate) continue
          for (let col = 0; col < candidate.length; col++) {
            if (isDayNum(candidate[col])) {
              dateRowIdx = r
              dateStartCol = col
              break
            }
          }
          if (dateRowIdx !== -1) break
        }
        if (dateRowIdx === -1) continue

        const dateRow = jsonData[dateRowIdx]
        const timeRow1 = jsonData[dateRowIdx + 1] || []
        const timeRow2 = jsonData[dateRowIdx + 2] || []
        const timeRow3 = jsonData[dateRowIdx + 3] || []

        employeesProcessed++
        toast.loading(`Processing ${salaryRecord.employee_name}...`, { id: loadingToast })

        for (let col = dateStartCol; col < dateRow.length; col++) {
          const dayNum = getDayNum(dateRow[col])
          if (!isDayNum(dateRow[col])) continue

          const allTimes = [
            ...parseAllTimes(timeRow1[col]),
            ...parseAllTimes(timeRow2[col]),
            ...parseAllTimes(timeRow3[col]),
          ]
          if (allTimes.length < 2) continue

          const inTime = allTimes[0]
          const outTime = allTimes[allTimes.length - 1]

          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          try {
            await updateAttendance({
              employee_id: salaryRecord.employee,
              date: dateStr,
              in_time: inTime,
              out_time: outTime,
            })
            totalUpdated++
          } catch {
            totalSkipped++
          }
        }
      }

      toast.dismiss(loadingToast)
      if (employeesProcessed === 0) {
        toast.error('No matching employees found in Excel')
      } else {
        toast.success(`✅ Done! ${employeesProcessed} employees, ${totalUpdated} days saved, ${totalSkipped} skipped`)
      }

      // Reload attendance data
      loadAllEmployeeAttendance()
    } catch (err) {
      console.error('Bulk attendance upload error:', err)
      toast.error('Upload failed: ' + err.message, { id: loadingToast })
    } finally {
      setUploadingExcel(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 max-w-[1600px] mx-auto">

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Salary Management</h1>
        </div>

        {/* Search + Buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-80 bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            {Object.keys(generatedSalaries).length > 0 && salaries.some(s => !generatedSalaries[s.employee]?.generated) && (
            <button
              onClick={handleBulkSalaryGenerate}
              disabled={bulkGenerating}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkGenerating ? 'Generating...' : 'Generate All Salaries'}
            </button>
            )}
            <button
              onClick={handleSendCompOffNotifications}
              disabled={notifSending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {notifSending ? 'Sending...' : 'Comp Off Notifications'}
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 bg-white transition-colors whitespace-nowrap"
            >
              + Add Employee
            </button>
          </div>
        </div>

        {/* Month/Year Selector + Excel Upload */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Month</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Select Year</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="pt-5 flex items-center gap-3">
              <label
                htmlFor="bulk-attendance-upload-main"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
              </label>
              <input
                id="bulk-attendance-upload-main"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={uploadingExcel}
                onChange={handleBulkAttendanceUpload}
              />
              <button
                onClick={handleDownloadExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Salary Excel
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Showing Data For</p>
            <p className="text-lg font-bold text-gray-900">
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][selectedMonth - 1]} {selectedYear}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Sr.</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee ID</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Working Days</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Present</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Half Days</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">WFH</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Comp Off</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross Annual</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Monthly Gross</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Salary Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSalaries.map((salary, index) => {
                    const name = salary.employee_name ?? `${salary.employee?.first_name} ${salary.employee?.last_name}`
                    const attendance = employeeAttendance[salary.employee] || {
                      workingDays: 0,
                      presentDays: 0,
                      halfDays: 0,
                      leaveDays: 0,
                      wfhDays: 0,
                      compOffDays: 0
                    }
                    const salaryStatus = generatedSalaries[salary.employee] || { generated: false, finalSalary: 0 }
                    return (
                      <tr key={salary.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{salary.emp_code}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-gray-700">{attendance.workingDays}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-emerald-600">{attendance.presentDays}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-orange-600">{attendance.halfDays}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-amber-600">{attendance.leaveDays}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-violet-600">{attendance.wfhDays}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-semibold text-sky-600">{attendance.compOffDays}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">₹{Number(salary.gross_annual_salary)?.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">₹{Number(salary.monthly_salary)?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {salaryStatus.generated ? (
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full mb-1 inline-flex items-center gap-1">
                                <span>✓</span>
                                <span>Generated</span>
                              </span>
                              <span className="text-xs font-bold text-gray-900">₹{Number(salaryStatus.finalSalary).toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full inline-block">Not Generated</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="small"
                              onClick={() => { setFormData({ id: salary.id, employee: salary.employee, gross_annual_salary: salary.gross_annual_salary, actual_variable_pay: salary.actual_variable_pay, financial_year: salary.financial_year }); setIsEditModalOpen(true) }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              onClick={() => openDetailsDrawer(salary)}
                            >
                              Attendance
                            </Button>
                            <Button
                              size="small"
                              danger
                              onClick={() => handleDeleteSalary(salary.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredSalaries.length === 0 && (
                    <tr>
                      <td colSpan="13" className="px-4 py-12 text-center text-gray-400 text-sm">No salary records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bulk Attendance Upload Modal */}
        <Modal
          title="Upload Attendance Excel"
          open={isBulkUploadModalOpen}
          onCancel={() => setIsBulkUploadModalOpen(false)}
          footer={null}
          width={500}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select month & year, then upload the Excel file. Attendance of all employees in the file will be saved.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bulkUploadMonth}
                  onChange={e => setBulkUploadMonth(Number(e.target.value))}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={bulkUploadYear}
                  onChange={e => setBulkUploadYear(Number(e.target.value))}
                >
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Excel File</label>
              <label
                htmlFor="bulk-attendance-upload"
                className={`flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${bulkUploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
              >
                <span className="text-2xl">📂</span>
                <span className="text-sm text-gray-600 font-medium">
                  {bulkUploading ? 'Uploading...' : 'Click to choose .xlsx / .xls file'}
                </span>
              </label>
              <input
                id="bulk-attendance-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                disabled={bulkUploading}
                onChange={handleBulkAttendanceUpload}
              />
            </div>

            <p className="text-xs text-gray-500">
              Excel must have rows with <code className="bg-gray-100 px-1 py-0.5 rounded">UserID:</code> or <code className="bg-gray-100 px-1 py-0.5 rounded">Name:</code> followed by date row, in-time row, out-time row.
            </p>
          </div>
        </Modal>

        {/* Add Salary Modal */}
        <Modal
          title="Add Salary Information"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleAddSalary}>
              Add Salary
            </Button>,
          ]}
          width={500}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.financial_year}
                onChange={(e) => setFormData({ ...formData, financial_year: e.target.value })}
              >
                <option>2023-24</option>
                <option>2024-25</option>
                <option>2025-26</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.employee}
                onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
              >
                <option value="">-- Select Employee --</option>
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gross Annual Salary</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500000"
                value={formData.gross_annual_salary}
                onChange={(e) => {
                  const value = e.target.value
                  const variablePay = value ? Math.round(Number(value) * 0.1) : ""
                  setFormData({ ...formData, gross_annual_salary: value, actual_variable_pay: variablePay })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Variable Pay (10% of Gross)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed"
                value={formData.actual_variable_pay}
                readOnly
              />
            </div>
          </div>
        </Modal>

        {/* Excel Download Modal */}
        <Modal
          title="Download Salary Excel"
          open={isExcelModalOpen}
          onCancel={() => setIsExcelModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsExcelModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="download" type="primary" onClick={handleDownloadExcel}>
              Download
            </Button>,
          ]}
          width={400}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={excelMonth}
                onChange={(e) => setExcelMonth(Number(e.target.value))}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Year</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={excelYear}
                onChange={(e) => setExcelYear(Number(e.target.value))}
              >
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </Modal>

        {/* Edit Salary Modal */}
        <Modal
          title="Edit Salary"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleUpdateSalary}>
              Update
            </Button>,
          ]}
          width={500}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gross Annual Salary</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.gross_annual_salary}
                onChange={(e) => {
                  const value = e.target.value
                  const variablePay = value ? Math.round(Number(value) * 0.1) : ""
                  setFormData({ ...formData, gross_annual_salary: value, actual_variable_pay: variablePay })
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Variable Pay (10% of Gross)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed"
                value={formData.actual_variable_pay}
                readOnly
              />
            </div>
          </div>
        </Modal>
      </div>

      {/* Details Drawer - slides from right */}
      {drawerEmployee && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerEmployee(null)} />
          <div className="w-full max-w-5xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setDrawerEmployee(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <span className="text-sm text-gray-500">Salary Attendance — {drawerEmployee.name}</span>
            </div>
            <div className="overflow-y-auto flex-1">
            <SalaryAttendance
              employeeId={drawerEmployee.id}
              employeeName={drawerEmployee.name}
              employeeMonthlySalary={drawerEmployee.monthlySalary}
            />
            </div>
          </div>
        </div>
      )}
      <ErrorCard
        type={errorCard.type}
        title={errorCard.title}
        message={errorCard.message}
        description={errorCard.description}
        buttonText={errorCard.buttonText}
        visible={errorCard.visible}
        onButtonClick={errorCard.onButtonClick}
        onClose={() => setErrorCard(prev => ({ ...prev, visible: false }))}
      />

      {/* Bulk Salary Generation Result Popup */}
      {bulkResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center border-4 ${bulkResult.success ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'
              }`}>
              {bulkResult.success ? (
                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {bulkResult.success ? 'Salary Generated Successfully!' : 'Salary Generation Complete'}
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{bulkResult.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Success</p>
                  <p className="text-2xl font-bold text-green-600">{bulkResult.successCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Skipped</p>
                  <p className="text-2xl font-bold text-blue-600">{bulkResult.skippedCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{bulkResult.failedCount}</p>
                </div>
              </div>
              {bulkResult.skippedCount > 0 && (
                <p className="text-xs text-blue-600 text-center mt-2">{bulkResult.skippedCount} employee(s) already had salary generated, skipped.</p>
              )}
            </div>

            {bulkResult.failedCount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Failed Employees:</p>
                <div className="max-h-32 overflow-y-auto">
                  {bulkResult.failedEmployees.map((name, idx) => (
                    <p key={idx} className="text-xs text-red-700">• {name}</p>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setBulkResult(null)}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalaryManagement
