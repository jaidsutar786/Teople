import { useEffect, useState } from 'react'
import { getSalaryExpenseReport, updateSalaryExpense } from '../../api'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const MONTHS = [
  [1,'January'],[2,'February'],[3,'March'],[4,'April'],[5,'May'],[6,'June'],
  [7,'July'],[8,'August'],[9,'September'],[10,'October'],[11,'November'],[12,'December']
]

export default function SalaryExpenseManagement() {
  const [report, setReport] = useState({ records: [], monthly_total: 0, yearly_total: 0, monthly_paid: 0, yearly_paid: 0 })
  const [loading, setLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  const load = () => {
    setLoading(true)
    getSalaryExpenseReport({ month: filterMonth, year: filterYear })
      .then(r => {
        console.log('📊 Salary Expense Report Data:', r);
        console.log('💰 First record:', r.records[0]);
        setReport(r);
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterMonth, filterYear])

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Salary Expense</h1>
        <div className="flex gap-3">
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="number" value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24" />
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <InformationCircleIcon className="w-4 h-4 flex-shrink-0" />
        Salary records are auto-synced from <strong className="mx-1">Salary Management</strong> when salary is generated. Mark as Paid after disbursement.
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Salary This Month', value: fmt(report.monthly_total), color: 'text-blue-700' },
          { label: 'Paid This Month',          value: fmt(report.monthly_paid),  color: 'text-green-700' },
          { label: 'Total Salary This Year',   value: fmt(report.yearly_total),  color: 'text-purple-700' },
          { label: 'Paid This Year',           value: fmt(report.yearly_paid),   color: 'text-orange-700' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Employee', 'Month', 'Basic', 'Bonus', 'Deductions', 'Net Salary'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : report.records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No records for this month</td></tr>
            ) : report.records.map(rec => (
              <tr key={rec.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{rec.employee_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{rec.month_display} {rec.year}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{fmt(rec.basic_salary)}</td>
                <td className="px-4 py-3 text-sm text-green-600">+{fmt(rec.bonus)}</td>
                <td className="px-4 py-3 text-sm text-red-600">-{fmt(rec.deductions)}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(rec.net_salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
