import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Button, Input, Popconfirm, Tag, Select } from "antd"
import { PlusOutlined, DeleteOutlined, EditOutlined, CalendarOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import {
  getCompanyLeaves,
  addCompanyLeave,
  deleteCompanyLeave,
  getSaturdayOverrides,
  updateSaturdayOverride
} from "../api"

const LeaveManagement = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [companyLeaves, setCompanyLeaves] = useState([])
  const [saturdayOverrides, setSaturdayOverrides] = useState({})
  const [calendarDays, setCalendarDays] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [inlineReason, setInlineReason] = useState("")
  const [addingLeave, setAddingLeave] = useState(false)

  useEffect(() => { loadData() }, [selectedMonth, selectedYear])

  const loadData = async () => {
    setLoading(true)
    initializeCalendar()
    await Promise.all([loadCompanyLeaves(), loadSaturdayOverrides()])
    setLoading(false)
  }

  const initializeCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay()
    const days = []
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dayOfWeek = date.getDay()
      const weekNumber = Math.ceil(day / 7)
      days.push({
        date: formatDate(date), day, dayOfWeek, weekNumber,
        isSunday: dayOfWeek === 0,
        isSaturday: dayOfWeek === 6,
        isPaidSaturday: dayOfWeek === 6 && (weekNumber === 2 || weekNumber === 4),
        isWorkingSaturday: dayOfWeek === 6 && (weekNumber === 1 || weekNumber === 3)
      })
    }
    setCalendarDays(days)
  }

  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const loadCompanyLeaves = async () => {
    try {
      const data = await getCompanyLeaves(selectedMonth + 1, selectedYear)
      setCompanyLeaves(data)
    } catch (err) { console.error(err) }
  }

  const loadSaturdayOverrides = async () => {
    try {
      const data = await getSaturdayOverrides(selectedMonth + 1, selectedYear)
      setSaturdayOverrides(data)
    } catch (err) { console.error(err) }
  }

  const handleAddLeave = async () => {
    if (!inlineReason.trim()) { toast.error("Please enter a reason"); return }
    try {
      setAddingLeave(true)
      await addCompanyLeave({ date: selectedDate, reason: inlineReason, month: selectedMonth + 1, year: selectedYear })
      await loadData()
      toast.success("Holiday added!")
      setInlineReason("")
    } catch { toast.error("Failed to add holiday") }
    finally { setAddingLeave(false) }
  }

  const handleDeleteLeave = async (dateToDelete) => {
    try {
      setLoading(true)
      await deleteCompanyLeave(dateToDelete)
      await loadData()
      toast.success("Holiday deleted")
      if (selectedDate === dateToDelete) setSelectedDate(null)
    } catch { toast.error("Failed to delete holiday") }
    finally { setLoading(false) }
  }

  const handleSaturdayToggle = async (dateStr, currentStatus) => {
    const newStatus = currentStatus === "working" ? "off" : "working"
    try {
      setLoading(true)
      await updateSaturdayOverride({ date: dateStr, status: newStatus, month: selectedMonth + 1, year: selectedYear })
      await loadData()
      toast.success(`Saturday marked as ${newStatus === "working" ? "Working Day" : "Paid Off"}`)
    } catch { toast.error("Failed to update Saturday status") }
    finally { setLoading(false) }
  }

  const isCompanyLeave = (dateStr) => companyLeaves.some(l => l.date === dateStr)
  const getLeaveReason = (dateStr) => companyLeaves.find(l => l.date === dateStr)?.reason || ""

  const getSaturdayStatus = (day) => {
    if (!day.isSaturday) return null
    const override = saturdayOverrides[day.date]
    if (override) return override
    return day.isPaidSaturday ? "off" : "working"
  }

  const getSelectedDateInfo = () => {
    if (!selectedDate) return null
    const day = calendarDays.find(d => d && d.date === selectedDate)
    if (!day) return null
    const saturdayStatus = getSaturdayStatus(day)
    const companyLeave = isCompanyLeave(day.date)
    return {
      date: day.date, day: day.day,
      dayOfWeek: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][day.dayOfWeek],
      isSunday: day.isSunday, isSaturday: day.isSaturday,
      isCompanyLeave: companyLeave, leaveReason: getLeaveReason(day.date),
      saturdayStatus, weekNumber: day.weekNumber,
      isPaidSaturday: day.isPaidSaturday, isWorkingSaturday: day.isWorkingSaturday
    }
  }

  const getDayStyle = (day) => {
    if (!day) return {}
    const isSelected = selectedDate === day.date
    const isToday = day.date === formatDate(new Date())
    const companyLeave = isCompanyLeave(day.date)
    const satStatus = day.isSaturday ? getSaturdayStatus(day) : null
    let dotColor = null
    if (companyLeave) dotColor = '#ef4444'
    else if (day.isSaturday && satStatus === 'off') dotColor = '#f97316'
    else if (day.isSaturday && satStatus === 'working') dotColor = '#3b82f6'
    return { dotColor, isSelected, isToday, companyLeave, satStatus }
  }

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const info = getSelectedDateInfo()

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i, label: new Date(2000, i).toLocaleString("default", { month: "long" })
  }))
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: selectedYear - 2 + i, label: String(selectedYear - 2 + i)
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f9fa', overflow: 'hidden' }}>

      {/* Top Header Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarOutlined style={{ fontSize: 18, color: '#fff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>Leave Management</h1>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Manage company holidays and working days</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL - Calendar */}
        <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Month/Year selector */}
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6' }}>
            <Select value={selectedMonth} onChange={(val) => setSelectedMonth(val)} options={monthOptions} variant="borderless" style={{ fontWeight: 700, fontSize: 15, color: '#111827', width: 130 }} />
            <Select value={selectedYear} onChange={(val) => setSelectedYear(val)} options={yearOptions} variant="borderless" style={{ fontWeight: 700, fontSize: 15, color: '#111827', width: 80 }} />
          </div>

          {/* Week day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 12px 4px' }}>
            {weekDayLabels.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === 0 ? '#ef4444' : '#9ca3af', paddingBottom: 4 }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 12px 12px', gap: 2 }}>
            {calendarDays.map((day, index) => {
              if (!day) return <div key={index} />
              const { dotColor, isSelected, isToday, companyLeave, satStatus } = getDayStyle(day)
              const isClickable = !day.isSunday
              return (
                <div
                  key={index}
                  onClick={() => { if (isClickable) { setSelectedDate(day.date); setInlineReason('') } }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: 40, borderRadius: 50, cursor: isClickable ? 'pointer' : 'default',
                    background: isSelected ? '#4f46e5'
                      : isToday ? '#e0e7ff'
                      : companyLeave ? '#fee2e2'
                      : day.isSaturday && satStatus === 'off' ? '#fff7ed'
                      : day.isSaturday && satStatus === 'working' ? '#eff6ff'
                      : 'transparent',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected && isClickable) e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background =
                      isToday ? '#e0e7ff' : companyLeave ? '#fee2e2'
                      : day.isSaturday && satStatus === 'off' ? '#fff7ed'
                      : day.isSaturday && satStatus === 'working' ? '#eff6ff' : 'transparent'
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400,
                    color: isSelected ? '#fff' : isToday ? '#4f46e5' : companyLeave ? '#dc2626'
                      : day.isSunday ? '#d1d5db'
                      : day.isSaturday && satStatus === 'off' ? '#ea580c'
                      : day.isSaturday && satStatus === 'working' ? '#2563eb' : '#374151'
                  }}>
                    {day.day}
                  </span>
                  {dotColor && !isSelected && (
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: dotColor, marginTop: 1 }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px', marginTop: 'auto' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Legend</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
              {[
                { color: '#ef4444', label: 'Company Holiday' },
                { color: '#f97316', label: 'Paid Sat (2nd/4th)' },
                { color: '#3b82f6', label: 'Working Saturday' },
                { color: '#4f46e5', label: 'Today / Selected' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Detail */}
        <div style={{ flex: 1, background: '#f8f9fa', overflowY: 'auto' }}>
          {!selectedDate ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 56, height: 56, background: '#e5e7eb', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarOutlined style={{ fontSize: 26, color: '#9ca3af' }} />
              </div>
              <p style={{ color: '#6b7280', fontWeight: 500, fontSize: 14, margin: 0 }}>No date selected</p>
              <p style={{ color: '#9ca3af', fontSize: 12, margin: 0 }}>Click any date to view details</p>
            </div>
          ) : info && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* Date header strip */}
              <div style={{
                padding: '20px 28px', borderBottom: '1px solid #e5e7eb', flexShrink: 0,
                background: info.isCompanyLeave ? '#fef2f2' : info.isSunday ? '#f9fafb'
                  : info.isSaturday && info.saturdayStatus === 'off' ? '#fff7ed'
                  : info.isSaturday ? '#eff6ff' : '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 4px' }}>
                      {info.dayOfWeek}
                    </p>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>
                      {dayjs(info.date).format('DD MMMM YYYY')}
                    </h2>
                  </div>
                  <div>
                    {info.isCompanyLeave && <Tag color="error">Company Holiday</Tag>}
                    {info.isSunday && <Tag color="default">Weekly Off</Tag>}
                    {info.isSaturday && !info.isCompanyLeave && (
                      <Tag color={info.saturdayStatus === 'off' ? 'orange' : 'blue'}>
                        {info.saturdayStatus === 'off' ? 'Paid Saturday' : 'Working Saturday'}
                      </Tag>
                    )}
                    {!info.isSunday && !info.isSaturday && !info.isCompanyLeave && (
                      <Tag color="success">Working Day</Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Detail content */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Holiday detail */}
                {info.isCompanyLeave && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Holiday Name</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#b91c1c' }}>{info.leaveReason}</span>
                      <Popconfirm title="Remove this holiday?" onConfirm={() => handleDeleteLeave(selectedDate)} okText="Remove" cancelText="Cancel">
                        <Button danger icon={<DeleteOutlined />} size="small" type="text" />
                      </Popconfirm>
                    </div>
                  </div>
                )}

                {/* Add holiday */}
                {!info.isCompanyLeave && !info.isSunday && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Mark as Holiday</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        placeholder="Enter holiday name (e.g. Republic Day)"
                        value={inlineReason}
                        onChange={(e) => setInlineReason(e.target.value)}
                        onPressEnter={handleAddLeave}
                      />
                      <Button type="primary" icon={<PlusOutlined />} loading={addingLeave} onClick={handleAddLeave}
                        style={{ background: '#4f46e5', border: 'none', minWidth: 80 }}>
                        Add
                      </Button>
                    </div>
                  </div>
                )}

                {/* Saturday settings */}
                {info.isSaturday && !info.isCompanyLeave && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 8 }}>Saturday Settings</p>
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 8,
                      background: info.saturdayStatus === 'off' ? '#fff7ed' : '#eff6ff',
                      border: `1px solid ${info.saturdayStatus === 'off' ? '#fed7aa' : '#bfdbfe'}`
                    }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', margin: 0 }}>
                          Week {info.weekNumber} — {info.saturdayStatus === 'off' ? 'Paid Off' : 'Working Day'}
                        </p>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                          {info.isPaidSaturday ? 'Default: Paid Off (2nd/4th)' : 'Default: Working (1st/3rd)'}
                        </p>
                      </div>
                      <Button icon={<EditOutlined />} onClick={() => handleSaturdayToggle(selectedDate, info.saturdayStatus)} loading={loading} size="small">
                        {info.saturdayStatus === 'working' ? 'Mark Paid' : 'Mark Work'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sunday */}
                {info.isSunday && (
                  <div style={{ padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Sunday is a fixed weekly off. No changes can be made.</p>
                  </div>
                )}

                {/* Regular working day */}
                {!info.isSunday && !info.isSaturday && !info.isCompanyLeave && (
                  <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>This is a regular working day. You can mark it as a company holiday above.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeaveManagement
