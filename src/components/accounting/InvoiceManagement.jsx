import { useEffect, useState } from 'react'
import { getInvoices, getCustomers, createInvoice, updateInvoice, deleteInvoice } from '../../api'
import { PlusIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
}

const emptyItem = { item_name: '', description: '', quantity: 1, unit_price: '', tax_percent: 0, total: 0 }
const emptyForm = {
  customer: '', invoice_date: '', due_date: '', payment_expected_date: '',
  status: 'draft', notes: '', currency: 'INR', items: [{ ...emptyItem }]
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [statusFilter, setStatusFilter] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([getInvoices(statusFilter ? { status: statusFilter } : {}), getCustomers()])
      .then(([inv, cust]) => { setInvoices(inv.results ?? inv); setCustomers(cust.results ?? cust) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    const tax = parseFloat(item.tax_percent) || 0
    return { ...item, total: (qty * price * (1 + tax / 100)).toFixed(2) }
  }

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0), 0)
  const taxTotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unit_price) || 0) * (parseFloat(i.tax_percent) || 0) / 100, 0)
  const grandTotal = subtotal + taxTotal

  const updateItem = (idx, field, val) => {
    const items = form.items.map((it, i) => i === idx ? calcItem({ ...it, [field]: val }) : it)
    setForm(f => ({ ...f, items }))
  }

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...emptyItem }] }))
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true) }
  const openEdit = (inv) => {
    setForm({
      customer: inv.customer, invoice_date: inv.invoice_date, due_date: inv.due_date,
      payment_expected_date: inv.payment_expected_date || '', status: inv.status,
      notes: inv.notes || '', currency: inv.currency,
      items: inv.items?.length ? inv.items : [{ ...emptyItem }]
    })
    setEditId(inv.id)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer || !form.invoice_date || !form.due_date) return toast.error('Fill required fields')
    const cleanItems = form.items.map(({ invoice, total, ...item }) => item)
    const payload = {
      ...form,
      items: cleanItems,
      payment_expected_date: form.payment_expected_date || null,
    }
    try {
      if (editId) await updateInvoice(editId, payload)
      else await createInvoice(payload)
      toast.success(editId ? 'Invoice updated' : 'Invoice created')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || JSON.stringify(err?.response?.data) || 'Error saving invoice')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return
    await deleteInvoice(id)
    toast.success('Deleted')
    load()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
          </select>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
            <PlusIcon className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Invoice #', 'Customer', 'Date', 'Due Date', 'Grand Total', 'Balance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">No invoices found</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{inv.customer_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.invoice_date}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{inv.due_date}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">₹{Number(inv.grand_total).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">₹{Number(inv.balance).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[inv.status]}`}>
                      {inv.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{editId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Customer *</label>
                  <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Invoice Date *</label>
                  <input type="date" value={form.invoice_date} onChange={e => setForm(f => ({ ...f, invoice_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Due Date *</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Expected Date</label>
                  <input type="date" value={form.payment_expected_date} onChange={e => setForm(f => ({ ...f, payment_expected_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
                  <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase">Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                    <PlusIcon className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Item Name', 'Description', 'Qty', 'Unit Price', 'Tax %', 'Total', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {form.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1.5"><input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" placeholder="Item name" /></td>
                          <td className="px-2 py-1.5"><input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" placeholder="Description" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-xs" min="0" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="w-24 border border-gray-200 rounded px-2 py-1 text-xs" min="0" /></td>
                          <td className="px-2 py-1.5"><input type="number" value={item.tax_percent} onChange={e => updateItem(idx, 'tax_percent', e.target.value)} className="w-16 border border-gray-200 rounded px-2 py-1 text-xs" min="0" /></td>
                          <td className="px-2 py-1.5 text-xs font-medium text-gray-700">₹{Number(item.total).toLocaleString('en-IN')}</td>
                          <td className="px-2 py-1.5">
                            {form.items.length > 1 && (
                              <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Tax Total</span><span>₹{taxTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
                  {editId ? 'Update Invoice' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
