import { useState, useEffect } from "react"
import { getCompOffRequests, createCompOffRequest, exportCompOffCSV, exportCompOffPDF } from "../api"
import { toast } from "react-hot-toast"
import { ClockIcon, MagnifyingGlassIcon, PlusCircleIcon, DocumentArrowDownIcon, CalendarIcon } from "@heroicons/react/24/outline"

const CompOffForm = () => {
  const [activeTab, setActiveTab] = useState("apply")
  const [form, setForm] = useState({ date: "", reason: "", hours: "9" })
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await getCompOffRequests()
      setRequests(data)
    } catch (err) {
      toast.error("Failed to load comp off requests")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createCompOffRequest(form)
      toast.success("Comp Off Request Submitted!")
      setForm({ date: "", reason: "", hours: "9" })
      loadRequests()
      setActiveTab("requests")
    } catch (err) {
      toast.error("Failed to submit comp off request")
    }
  }

  const handleExportCSV = async () => { try { await exportCompOffCSV(); toast.success("CSV exported!") } catch { toast.error("Failed to export CSV") } }
  const handleExportPDF = async () => { try { await exportCompOffPDF(); toast.success("PDF exported!") } catch { toast.error("Failed to export PDF") } }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""

  const filteredRequests = requests.filter(r =>
    r.reason?.toLowerCase().includes(search.toLowerCase()) ||
    r.hours?.toString().includes(search) ||
    r.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.status?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage))
  const currentRequests = filteredRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const statusConfig = {
    pending:   { bg: "bg-amber-100 text-amber-700",   dot: "bg-amber-500"   },
    approved:  { bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
    rejected:  { bg: "bg-red-100 text-red-700",       dot: "bg-red-500"     },
    active:    { bg: "bg-blue-100 text-blue-700",     dot: "bg-blue-500"    },
    completed: { bg: "bg-gray-100 text-gray-700",     dot: "bg-gray-500"    },
  }

  const getHoursBadge = (h) => {
    const n = parseInt(h)
    if (n >= 9) return "bg-purple-100 text-purple-700"
    if (n >= 4) return "bg-blue-100 text-blue-700"
    return "bg-green-100 text-green-700"
  }

  const stats = [
    { label: "Total",    value: requests.length,                                                         color: "text-gray-900",    border: "border-gray-200" },
    { label: "Pending",  value: requests.filter(r => r.status?.toLowerCase() === "pending").length,  color: "text-amber-600",   border: "border-amber-200" },
    { label: "Approved", value: requests.filter(r => r.status?.toLowerCase() === "approved").length, color: "text-emerald-600", border: "border-emerald-200" },
    { label: "Rejected", value: requests.filter(r => r.status?.toLowerCase() === "rejected").length, color: "text-red-600",     border: "border-red-200" },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
            <ClockIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compensatory Off</h1>
            <p className="text-sm text-gray-500">Submit and track your comp off requests</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {stats.map(s => (
            <div key={s.label} className={`bg-white border ${s.border} rounded-xl px-4 py-2 text-center shadow-sm`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { key: "apply",    label: "Apply Comp Off", icon: PlusCircleIcon },
            { key: "requests", label: "My Requests",    icon: ClockIcon, count: requests.length },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-purple-600 text-purple-600 bg-purple-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activeTab === tab.key ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Apply Tab */}
        {activeTab === "apply" && (
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date <span className="text-red-500">*</span></label>
                <input type="date" required
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hours <span className="text-red-500">*</span></label>
                <select className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })}>
                  <option value="2">2 Hours</option>
                  <option value="4">4 Hours (Half Day)</option>
                  <option value="6">6 Hours</option>
                  <option value="9">9 Hours (Full Day)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
                <textarea required rows={4} placeholder="Describe the reason for your comp off request..."
                  className="w-full border border-gray-300 px-3 py-2.5 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit"
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md transition-all">
                  Submit Comp Off Request
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search requests..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <DocumentArrowDownIcon className="w-4 h-4 text-green-600" /> CSV
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <DocumentArrowDownIcon className="w-4 h-4 text-blue-600" /> PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent" />
              </div>
            ) : currentRequests.length === 0 ? (
              <div className="text-center py-16">
                <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">No comp off requests found</p>
                <p className="text-gray-400 text-sm mt-1">Submit your first comp off request</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {["Emp ID", "Employee", "Date", "Hours", "Reason", "Status", "Rejection Reason", "Submitted"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentRequests.map(r => {
                        const sc = statusConfig[r.status?.toLowerCase()] || statusConfig.pending
                        return (
                          <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">{r.employee_id || "—"}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-gray-900">{r.employee_name || "N/A"}</div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-gray-800 font-medium">{formatDate(r.date)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getHoursBadge(r.hours)}`}>
                                {r.hours}h
                              </span>
                            </td>
                            <td className="px-5 py-3.5 max-w-[180px]">
                              <p className="text-gray-700 text-xs truncate" title={r.reason}>{r.reason || "—"}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                {r.status || "Unknown"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 max-w-[160px]">
                              {r.status === "Rejected" && r.rejection_reason ? (
                                <div className="bg-red-50 border border-red-200 rounded-md px-2 py-1">
                                  <p className="text-xs text-red-700 truncate" title={r.rejection_reason}>{r.rejection_reason}</p>
                                </div>
                              ) : <span className="text-gray-300 text-xs">—</span>}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                              {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                  <p className="text-xs text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length}</p>
                  <div className="flex items-center gap-1.5">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
                    <span className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg">{currentPage} / {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CompOffForm
