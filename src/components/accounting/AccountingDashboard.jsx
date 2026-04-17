import { useEffect, useState } from 'react'
import { getAccountingDashboard, getExpenses, getPayments } from '../../api'
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const KPICard = ({ label, value, trend, trendValue, subtitle }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <span className="text-xs text-gray-400">•••</span>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
    {trend && (
      <div className="flex items-center gap-1">
        <span className={`flex items-center text-xs font-semibold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
          {trendValue}
        </span>
        <span className="text-xs text-gray-400">{subtitle}</span>
      </div>
    )}
  </div>
)

const ExpensesChart = ({ expenses }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  // Group expenses by month for selected year
  const monthlyData = months.map((_, idx) => {
    const monthExpenses = expenses.filter(e => {
      const d = new Date(e.expense_date)
      return d.getFullYear() === selectedYear && d.getMonth() === idx
    })
    return monthExpenses.reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
  })
  
  const maxVal = Math.max(...monthlyData, 1)
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">Expenses Overview</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center">{selectedYear}</span>
          <button 
            onClick={() => setSelectedYear(selectedYear + 1)}
            disabled={selectedYear >= currentYear}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-end justify-between h-48 gap-2">
        {months.map((m, i) => {
          const isCurrentMonth = i === currentMonth && selectedYear === currentYear
          const isFutureMonth = selectedYear === currentYear && i > currentMonth
          
          return (
            <div key={m} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="relative w-full">
                <div 
                  className={`w-full rounded-t-lg transition-all ${
                    isFutureMonth ? 'bg-gray-200' : isCurrentMonth ? 'bg-gray-800' : 'bg-indigo-500'
                  } hover:opacity-80`}
                  style={{ height: `${monthlyData[i] > 0 ? (monthlyData[i] / maxVal) * 180 : 2}px` }}
                />
                {monthlyData[i] > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {fmt(monthlyData[i])}
                  </div>
                )}
              </div>
              <span className={`text-xs ${
                isFutureMonth ? 'text-gray-300' : isCurrentMonth ? 'text-gray-900 font-semibold' : 'text-gray-500'
              }`}>{m}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const DonutChart = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-6">Expenses Breakdown</h3>
        <p className="text-sm text-gray-500 text-center py-8">Loading...</p>
      </div>
    )
  }

  // Show 3 main categories from dashboard API - using exact values from backend
  const expenseData = [
    { label: 'Invoices', value: Number(data.total_invoices_amount || 0), color: '#6366f1' },
    { label: 'Expenses', value: Number(data.total_expenses || 0), color: '#8b5cf6' },
    { label: 'Salary', value: Number(data.total_salary_expense || 0), color: '#60a5fa' },
  ].filter(e => e.value > 0)
  
  const total = expenseData.reduce((s, e) => s + e.value, 0)
  
  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-6">Expenses Breakdown</h3>
        <p className="text-sm text-gray-500 text-center py-8">No expense data available</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">Expenses Breakdown</h3>
        <span className="text-xs text-gray-400">•••</span>
      </div>
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
            {expenseData.reduce((acc, exp, i) => {
              const percent = (exp.value / total) * 100
              const offset = acc.offset
              acc.offset += percent
              acc.elements.push(
                <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={exp.color} strokeWidth="20"
                  strokeDasharray={`${percent * 2.51} ${251 - percent * 2.51}`}
                  strokeDashoffset={-offset * 2.51} />
              )
              return acc
            }, { offset: 0, elements: [] }).elements}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-lg font-bold">{fmt(total)}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {expenseData.map((exp, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: exp.color }} />
              <span className="text-gray-600">{exp.label}</span>
            </div>
            <span className="font-semibold text-gray-900">{fmt(exp.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TransactionTable = ({ payments }) => {
  const recentPayments = payments.slice(0, 5)
  
  if (recentPayments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Transaction History</h3>
        <p className="text-sm text-gray-500 text-center py-8">No transactions available</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-gray-900">Transaction History</h3>
        <span className="text-xs text-gray-500">Recent Payments</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Customer</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Amount</th>
              <th className="text-left text-xs font-medium text-gray-500 pb-3">Mode</th>
            </tr>
          </thead>
          <tbody>
            {recentPayments.map((p, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {(p.customer_name || 'U')[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{p.customer_name || 'Unknown'}</span>
                </td>
                <td className="text-sm text-gray-600">{new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                <td className="text-sm font-semibold text-gray-900">{fmt(p.amount_received)}</td>
                <td>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                    {p.payment_mode || 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AccountingDashboard() {
  const [data, setData] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAccountingDashboard(),
      getExpenses(),
      getPayments()
    ])
      .then(([dashData, expData, payData]) => {
        setData(dashData)
        setExpenses(expData.results || expData)
        setPayments(payData.results || payData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
    </div>
  )

  const profitTrend = Number(data?.net_profit) >= 0 ? 'up' : 'down'
  const currentDate = new Date()
  const dateRange = `From Jan 01, ${currentDate.getFullYear()} to ${currentDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Accounting Dashboard</h1>
        
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard 
            label="Net Profit" 
            value={fmt(data?.net_profit)} 
            trend={profitTrend} 
            trendValue="(INR)" 
            subtitle={dateRange} 
          />
          <KPICard 
            label="Closing Balance" 
            value={fmt(data?.total_payments_received)} 
            trend="up" 
            trendValue="(INR)" 
            subtitle={dateRange} 
          />
          <KPICard 
            label="Accounts Receivable" 
            value={fmt(data?.total_pending_amount)} 
            trend="up" 
            trendValue="(INR)" 
            subtitle="Pending invoices balance" 
          />
          <KPICard 
            label="Accounts Payable" 
            value={fmt(data?.total_expenses)} 
            trend="down" 
            trendValue="(INR)" 
            subtitle="Total expenses (excl. salary)" 
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <ExpensesChart expenses={expenses} />
          </div>
          <DonutChart data={data} />
        </div>

        {/* Transaction Table */}
        <TransactionTable payments={payments} />
      </div>
    </div>
  )
}
