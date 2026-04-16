import { useState, useEffect } from 'react'
import { getMonthlySalaryHistory, downloadProfessionalSalarySlip, getEmployees, getAttendanceWithLeaves, getCompanyLeaves, getSaturdayOverrides } from '../api'
import { toast } from 'react-hot-toast'
import { ArrowDownTrayIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const statusBadge = (day, saturdayOverrides) => {
  if (day.isCompanyLeave) return { label: 'Holiday', cls: 'bg-purple-100 text-purple-700' }
  if (day.status === 'comp_off') return { label: 'Comp Off', cls: 'bg-sky-100 text-sky-700' }
  if (day.status === 'leave') return { label: 'Leave', cls: 'bg-amber-100 text-amber-700' }
  if (day.status === 'wfh') return { label: 'WFH', cls: 'bg-violet-100 text-violet-700' }
  if (day.isWeekend) {
    const d = new Date(day.date)
    if (d.getDay() === 6) {
      const wk = Math.ceil(d.getDate() / 7)
      const isPaid = saturdayOverrides[day.date] ? saturdayOverrides[day.date] === 'off' : (wk === 2 || wk === 4)
      return isPaid ? { label: 'Paid Sat', cls: 'bg-green-100 text-green-700' } : { label: 'Working Sat', cls: 'bg-blue-100 text-blue-700' }
    }
    return { label: 'Sunday', cls: 'bg-slate-100 text-slate-500' }
  }
  if (day.status === 'half_day') return { label: 'Half Day', cls: 'bg-orange-100 text-orange-700' }
  if (day.status === 'present' && day.totalHours && parseFloat(day.totalHours) < 9)
    return { label: 'Present <9h', cls: 'bg-yellow-100 text-yellow-700' }
  if (day.status === 'present') return { label: 'Present', cls: 'bg-emerald-100 text-emerald-700' }
  return { label: 'Absent', cls: 'bg-gray-100 text-gray-500' }
}

const EmployeePayslip = () => {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth())
  const [year, setYear] = useState(currentDate.getFullYear())
  const [attendance, setAttendance] = useState([])
  const [saturdayOverrides, setSaturdayOverrides] = useState({})
  const [salarySlips, setSalarySlips] = useState([])
  const [employeeId, setEmployeeId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [viewingSlip, setViewingSlip] = useState(null)

  useEffect(() => { init() }, [])
  useEffect(() => { if (employeeId) loadAttendance() }, [employeeId, month, year])

  const init = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'))
      const employees = await getEmployees()
      const emp = employees.find(e => e.user_id === user.id)
      if (!emp) { toast.error('Employee not found'); return }
      setEmployeeId(emp.id)
      const history = await getMonthlySalaryHistory(emp.id)
      setSalarySlips(history)
    } catch (e) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const loadAttendance = async () => {
    setAttendanceLoading(true)
    try {
      const [data, leaves, overrides] = await Promise.all([
        getAttendanceWithLeaves(employeeId, month, year),
        getCompanyLeaves(month + 1, year),
        getSaturdayOverrides(month + 1, year),
      ])
      setSaturdayOverrides(overrides)
      const leaveDates = leaves.map(l => l.date)
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const days = []
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const dateStr = formatDate(date)
        const record = data.attendance_records?.find(r => r.date === dateStr)
        const dayOfWeek = date.getDay()
        const isCompanyLeave = leaveDates.includes(dateStr)
        let isWeekend = false
        if (isCompanyLeave) isWeekend = true
        else if (dayOfWeek === 0) isWeekend = true
        else if (dayOfWeek === 6) {
          if (overrides[dateStr]) isWeekend = overrides[dateStr] === 'off'
          else { const wk = Math.ceil(d / 7); isWeekend = wk === 2 || wk === 4 }
        }
        const isLeave = data.leave_dates?.includes(dateStr)
        const isWFH = data.wfh_dates?.includes(dateStr)
        const isCompOff = data.comp_off_dates?.includes(dateStr)
        let status = 'absent'
        if (record) status = record.status
        else if (isLeave) status = 'leave'
        else if (isWFH) status = 'wfh'
        else if (isCompOff) status = 'comp_off'
        days.push({
          date: dateStr,
          day: date.toLocaleString('default', { weekday: 'short' }),
          dateNum: d,
          status,
          isWeekend,
          isCompanyLeave,
          inTime: record?.in_time_12h || null,
          outTime: record?.out_time_12h || null,
          totalHours: record?.total_hours || null,
        })
      }
      setAttendance(days)
    } catch (e) {
      console.error(e)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const formatDecimalHours = (h) => {
    if (!h) return ''
    const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60)
    return `${hrs}h ${mins}m`
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseFloat(amount) || 0)

  const handleDownload = async (slip) => {
    try {
      setDownloadingId(slip.id)
      await downloadProfessionalSalarySlip(employeeId, slip.month, slip.year)
      toast.success('Downloaded!')
    } catch (e) {
      toast.error('Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  // Stats
  const presentDays = attendance.filter(d => d.status === 'present').length
  const leaveDays = attendance.filter(d => d.status === 'leave').length
  const halfDays = attendance.filter(d => d.status === 'half_day').length
  const wfhDays = attendance.filter(d => d.status === 'wfh').length
  const absentDays = attendance.filter(d => !d.isWeekend && d.status === 'absent').length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Payslip</h1>
            <p className="text-sm text-gray-400 mt-0.5">Attendance record & salary history</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => year - 2 + i).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Present', value: presentDays, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { label: 'Leave', value: leaveDays, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
            { label: 'Half Day', value: halfDays, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
            { label: 'WFH', value: wfhDays, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
            { label: 'Absent', value: absentDays, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── ATTENDANCE TABLE ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-gray-900">{MONTHS[month]} {year} — Attendance</h2>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                ['bg-emerald-100 text-emerald-700', 'Present'],
                ['bg-yellow-100 text-yellow-700', '<9h'],
                ['bg-orange-100 text-orange-700', 'Half Day'],
                ['bg-amber-100 text-amber-700', 'Leave'],
                ['bg-violet-100 text-violet-700', 'WFH'],
                ['bg-sky-100 text-sky-700', 'Comp Off'],
                ['bg-purple-100 text-purple-700', 'Holiday'],
                ['bg-slate-100 text-slate-500', 'Weekend'],
              ].map(([cls, lbl]) => (
                <span key={lbl} className={`px-2 py-0.5 rounded-full font-medium ${cls}`}>{lbl}</span>
              ))}
            </div>
          </div>

          {attendanceLoading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Day</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock In</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock Out</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map(day => {
                    const badge = statusBadge(day, saturdayOverrides)
                    const isMuted = day.isWeekend || day.isCompanyLeave
                    return (
                      <tr key={day.date} className={isMuted ? 'bg-gray-50/70' : 'hover:bg-blue-50/20'}>
                        <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{day.day}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600 whitespace-nowrap">
                          {day.inTime || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-gray-600 whitespace-nowrap">
                          {day.outTime || <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          {day.totalHours ? (
                            <span className={`text-xs font-semibold ${parseFloat(day.totalHours) < 9 ? 'text-orange-500' : 'text-emerald-600'}`}>
                              {formatDecimalHours(parseFloat(day.totalHours))}
                            </span>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── SALARY SLIP TABLE ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Salary History</h2>
            <span className="text-sm text-gray-400">{salarySlips.length} records</span>
          </div>

          {salarySlips.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm">No salary slips generated yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Period</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Working</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Present</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Half Day</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">WFH</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Tax</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Net Salary</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salarySlips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="font-semibold text-gray-900">{MONTHS[slip.month - 1]} {slip.year}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{slip.total_working_days}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-emerald-600">{slip.present_days}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-amber-600">{slip.leave_days || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-orange-500">{slip.half_days || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-violet-600">{slip.wfh_days || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">{formatCurrency(slip.gross_monthly_salary)}</td>
                      <td className="px-4 py-3 text-right text-red-500 whitespace-nowrap">-{formatCurrency(slip.professional_tax)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="text-base font-bold text-emerald-600">{formatCurrency(slip.final_salary)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingSlip(slip)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                            title="View"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={downloadingId === slip.id}
                            className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingId === slip.id
                              ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                              : <ArrowDownTrayIcon className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Salary Slip Detail Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white rounded-t-2xl flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">Salary Slip</h3>
                <p className="text-blue-100 text-sm">{MONTHS[viewingSlip.month - 1]} {viewingSlip.year}</p>
              </div>
              <button onClick={() => setViewingSlip(null)} className="text-white/80 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-xs text-emerald-600 mb-1">Net Salary</p>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(viewingSlip.final_salary)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Gross Salary</p>
                  <p className="font-bold text-gray-900">{formatCurrency(viewingSlip.gross_monthly_salary)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-500 mb-1">Professional Tax</p>
                  <p className="font-bold text-red-600">-{formatCurrency(viewingSlip.professional_tax)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Attendance Breakdown</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Working Days', viewingSlip.total_working_days, 'text-gray-700'],
                    ['Present', viewingSlip.present_days, 'text-emerald-600'],
                    ['WFH', viewingSlip.wfh_days || 0, 'text-violet-600'],
                    ['Half Days', viewingSlip.half_days || 0, 'text-orange-500'],
                    ['Leave', viewingSlip.leave_days || 0, 'text-amber-600'],
                    ['Comp Off', viewingSlip.comp_off_days || 0, 'text-sky-600'],
                  ].map(([lbl, val, cls]) => (
                    <div key={lbl} className="flex justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">{lbl}</span>
                      <span className={`font-semibold ${cls}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setViewingSlip(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                  Close
                </button>
                <button
                  onClick={() => { handleDownload(viewingSlip); setViewingSlip(null) }}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeePayslip
