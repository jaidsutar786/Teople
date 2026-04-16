import { useEffect, useState } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, getAccountingEmployees } from '../../api'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const CATEGORIES = ['rent', 'utilities', 'office_supplies', 'salary', 'marketing', 'travel', 'other']

const emptyForm = {
  vendor_name: '', employee: '', expense_date: '', amount: '',
  category: 'other', tax_percent: 0, currency: 'INR',
  exchange_rate: 1, notes: '', is_paid: true
}

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [catFilter, setCatFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getExpenses(catFilter ? { category: catFilter } : {}), getAccountingEmployees()])
      .then(([exp, emp]) => { setExpenses(exp.results ?? exp); setEmployees(emp.results ?? emp) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [catFilter])

  const taxAmt = (parseFloat(form.amount) || 0) * (parseFloat(form.tax_percent) || 0) / 100
  const totalAmt = (parseFloat(form.amount) || 0) + taxAmt

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true) }
  const openEdit = (exp) => {
    setForm({
      vendor_name: exp.vendor_name || '', employee: exp.employee || '',
      expense_date: exp.expense_date, amount: exp.amount,
      category: exp.category, tax_percent: exp.tax_percent,
      currency: exp.currency, exchange_rate: exp.exchange_rate,
      notes: exp.notes || '', is_paid: exp.is_paid
    })
    setEditId(exp.id)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.expense_date || !form.amount) return toast.error('Fill required fields')
    const payload = { ...form, employee: form.employee || null }
    try {
      if (editId) await updateExpense(editId, payload)
      else await createExpense(payload)
      toast.success(editId ? 'Expense updated' : 'Expense added')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error('Error saving expense')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await deleteExpense(id)
    toast.success('Deleted')
    load()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
        <div className="flex gap-3">
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            <PlusIcon className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Date', 'Vendor / Employee', 'Category', 'Amount', 'Tax', 'Total', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No expenses found</td></tr>
            ) : expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">{exp.expense_date}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{exp.employee_name}</td>
                <td className="px-4 py-3"><span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{exp.category.replace('_', ' ').toUpperCase()}</span></td>
                <td className="px-4 py-3 text-sm text-gray-700">₹{Number(exp.amount).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{exp.tax_percent}%</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{Number(exp.total_amount).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${exp.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {exp.is_paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(exp)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Expense' : 'Add Expense'}</h2>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Vendor Name</label>
                  <input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Vendor / Company" />
                </div>
                {['salary', 'travel'].includes(form.category) && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Employee</label>
                    <select value={form.employee} onChange={e => setForm(f => ({ ...f, employee: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="">Select Employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Expense Date *</label>
                  <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value, employee: '' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Amount *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Tax %</label>
                  <input type="number" value={form.tax_percent} onChange={e => setForm(f => ({ ...f, tax_percent: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
                  <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="is_paid" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                  <label htmlFor="is_paid" className="text-sm text-gray-700">Mark as Paid</label>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm flex justify-between">
                <span className="text-gray-500">Tax: ₹{taxAmt.toFixed(2)}</span>
                <span className="font-semibold text-gray-900">Total: ₹{totalAmt.toFixed(2)}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                  {editId ? 'Update' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
