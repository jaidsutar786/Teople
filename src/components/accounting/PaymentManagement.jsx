import { useEffect, useState } from 'react'
import { getPayments, getCustomers, getUnpaidInvoices, createPayment, deletePayment } from '../../api'
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const emptyForm = {
  customer: '', invoice: '', payment_date: '', amount_received: '',
  payment_mode: 'cash', reference_number: '', bank_charges: 0,
  currency: 'INR', exchange_rate: 1, notes: ''
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState([])
  const [customers, setCustomers] = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    setLoading(true)
    Promise.all([getPayments(), getCustomers(), getUnpaidInvoices()])
      .then(([p, c, inv]) => {
        setPayments(p.results ?? p)
        setCustomers(c.results ?? c)
        setUnpaidInvoices(inv.results ?? inv)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filteredInvoices = unpaidInvoices.filter(
    inv => !form.customer || String(inv.customer) === String(form.customer)
  )

  const selectedInvoice = unpaidInvoices.find(i => String(i.id) === String(form.invoice))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer || !form.invoice || !form.amount_received) return toast.error('Fill required fields')
    if (selectedInvoice && parseFloat(form.amount_received) > parseFloat(selectedInvoice.balance)) {
      return toast.error(`Amount exceeds balance ₹${selectedInvoice.balance}`)
    }
    try {
      await createPayment(form)
      toast.success('Payment recorded')
      setShowModal(false)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err?.response?.data?.non_field_errors?.[0] || 'Error saving payment')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return
    await deletePayment(id)
    toast.success('Deleted')
    load()
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
        <button onClick={() => { setForm(emptyForm); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          <PlusIcon className="w-4 h-4" /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Invoice #', 'Customer', 'Date', 'Amount', 'Mode', 'Reference', 'Bank Charges', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No payments found</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-blue-600">{p.invoice_number}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{p.customer_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.payment_date}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700">₹{Number(p.amount_received).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{p.payment_mode.toUpperCase()}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.reference_number || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">₹{Number(p.bank_charges).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <TrashIcon className="w-4 h-4" />
                  </button>
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
              <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
              <button onClick={() => setShowModal(false)}><XMarkIcon className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Customer *</label>
                  <select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value, invoice: '' }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Invoice (Unpaid) *</label>
                  <select value={form.invoice} onChange={e => setForm(f => ({ ...f, invoice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required>
                    <option value="">Select Invoice</option>
                    {filteredInvoices.map(i => (
                      <option key={i.id} value={i.id}>{i.invoice_number} — Balance: ₹{Number(i.balance).toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                  {selectedInvoice && (
                    <p className="text-xs text-orange-600 mt-1">Outstanding Balance: ₹{Number(selectedInvoice.balance).toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Date *</label>
                  <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Amount Received *</label>
                  <input type="number" value={form.amount_received} onChange={e => setForm(f => ({ ...f, amount_received: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
                  <select value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {['cash', 'bank', 'cheque', 'upi'].map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Reference Number</label>
                  <input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Bank Charges</label>
                  <input type="number" value={form.bank_charges} onChange={e => setForm(f => ({ ...f, bank_charges: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" step="0.01" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
                  <input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
