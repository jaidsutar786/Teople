import { useState, useEffect, useRef } from "react"
import { PencilSquareIcon, UserGroupIcon, UsersIcon, UserPlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { getEmployees, addEmployee, updateEmployee } from "../api"
import OfferLetterModal from "./OfferLetterModal"
import RelievingLetterModal from "./RelievingLetterModal"
import ErrorCard from "./ErrorCard"
import toast, { Toaster } from 'react-hot-toast'
import { Button, Modal, Input, Select, Pagination } from 'antd'

const GenderSelect = ({ value, onChange }) => (
  <select value={value || ""} onChange={onChange}
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
    <option value="">Select Gender</option>
    <option value="male">Male</option>
    <option value="female">Female</option>
    <option value="other">Other</option>
  </select>
)

const DeptSelect = ({ value, onChange }) => (
  <select value={value || ""} onChange={onChange}
    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all">
    <option value="">Select Department</option>
    <option value="engineering">Engineering</option>
    <option value="design">Design</option>
    <option value="marketing">Marketing</option>
    <option value="hr">Human Resources</option>
    <option value="finance">Finance</option>
  </select>
)

const EmployeeTable = () => {
  const [data, setData] = useState([])
  const [editingRecord, setEditingRecord] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formValues, setFormValues] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  const [isOfferLetterModalOpen, setIsOfferLetterModalOpen] = useState(false)
  const [isRelievingLetterModalOpen, setIsRelievingLetterModalOpen] = useState(false)
  const [errorCard, setErrorCard] = useState({
    visible: false, type: 'error', title: 'ERROR', message: '',
    description: '', buttonText: 'Try Again', onButtonClick: () => {}
  })

  const fetchEmployees = async () => {
    try {
      const employees = await getEmployees()
      const formattedData = employees.map((emp) => ({
        id: emp.id,
        first_name: emp.first_name,
        last_name: emp.last_name,
        name: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        join_date: emp.joining_date || emp.created_at?.split("T")[0] || "",
        phone: emp.phone,
        gender: emp.gender,
        department: emp.department,
        position: emp.position,
        address: emp.address,
        profile_picture: emp.profile_picture,
        offer_letter_sent: emp.offer_letter_sent,
        offer_letter_ctc: emp.offer_letter_ctc,
        offer_letter_date: emp.offer_letter_date,
        offer_letter_pdf_url: emp.offer_letter_pdf_url ?
          (emp.offer_letter_pdf_url.startsWith('http') ? emp.offer_letter_pdf_url : `http://localhost:8000${emp.offer_letter_pdf_url}`) : null,
        relieving_letter_sent: emp.relieving_letter_sent,
        relieving_letter_date: emp.relieving_letter_date,
        last_working_day: emp.last_working_day,
        relieving_letter_pdf_url: emp.relieving_letter_pdf_url ?
          (emp.relieving_letter_pdf_url.startsWith('http') ? emp.relieving_letter_pdf_url : `http://localhost:8000${emp.relieving_letter_pdf_url}`) : null,
      }))
      setData(formattedData)
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  useEffect(() => { fetchEmployees() }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const totalEmployees = data.length
  const newEmployees = data.filter(e => {
    if (!e.join_date) return false
    const d = new Date(e.join_date), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const maleCount = data.filter(e => e.gender?.toLowerCase() === 'male').length
  const femaleCount = data.filter(e => e.gender?.toLowerCase() === 'female').length

  const filteredData = data.filter(emp => {
    const matchSearch = emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase())
    const matchDept = !deptFilter || emp.department?.toLowerCase() === deptFilter.toLowerCase()
    return matchSearch && matchDept
  })

  const totalRecords = filteredData.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setFormValues({
      name: record.name, email: record.email, join_date: record.join_date,
      phone: record.phone, gender: record.gender, department: record.department,
      position: record.position, address: record.address,
    })
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    try {
      await updateEmployee(editingRecord.id, {
        first_name: formValues.name.split(" ")[0] || formValues.name,
        last_name: formValues.name.split(" ")[1] || "",
        email: formValues.email, phone: formValues.phone,
        gender: formValues.gender, department: formValues.department,
        position: formValues.position, address: formValues.address,
        joining_date: formValues.join_date || null,
      })
      toast.success('Employee updated successfully!', { position: 'top-right', duration: 3000 })
      setIsEditModalOpen(false)
      fetchEmployees()
    } catch (error) {
      console.error("Error updating employee:", error)
      toast.error('Failed to update employee!', { position: 'top-right', duration: 3000 })
    }
  }

  const handleAdd = async () => {
    setLoading(true)
    try {
      const response = await addEmployee({
        first_name: formValues.name.split(" ")[0] || formValues.name,
        last_name: formValues.name.split(" ")[1] || "",
        email: formValues.email, phone: formValues.phone,
        gender: formValues.gender, department: formValues.department,
        position: formValues.position, address: formValues.address,
        joining_date: formValues.join_date || null,
      })
      setErrorCard({
        visible: true, type: 'success', title: 'SUCCESS',
        message: response.message || 'Employee added successfully!',
        description: response.detail || 'The employee has been added to the system.',
        buttonText: 'Continue',
        onButtonClick: () => { setIsAddModalOpen(false); setFormValues({}); fetchEmployees() }
      })
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to add employee'
      setErrorCard({
        visible: true, type: 'error', title: 'FAILED TO ADD EMPLOYEE',
        message: errorMessage,
        description: error.response?.data?.detail || 'Please check the information and try again.',
        buttonText: 'Try Again', onButtonClick: () => {}
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Employee', value: totalEmployees, bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', icon: <UserGroupIcon className="w-6 h-6 text-indigo-500" /> },
    // { label: 'New Employee', value: newEmployees, bg: 'bg-orange-50', iconBg: 'bg-orange-100', icon: <UserPlusIcon className="w-6 h-6 text-orange-400" /> },
    { label: 'Male', value: maleCount, bg: 'bg-blue-50', iconBg: 'bg-blue-100', icon: <UsersIcon className="w-6 h-6 text-blue-400" /> },
    { label: 'Female', value: femaleCount, bg: 'bg-teal-50', iconBg: 'bg-teal-100', icon: <UsersIcon className="w-6 h-6 text-teal-400" /> },
  ]

  const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
  const fv = formValues
  const setFv = (key, val) => setFormValues(prev => ({ ...prev, [key]: val }))

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-6 max-w-[1600px] mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <Button
            onClick={() => setIsAddModalOpen(true)}
          >
            <span className="text-base leading-none">+</span> Add New
          </Button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {statCards.map((card) => (
            <div key={card.label} className={`${card.bg} rounded-xl p-4 flex items-center gap-3`}>
              <div className={`${card.iconBg} rounded-lg p-2.5`}>{card.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="text-xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search employee..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-52 bg-white" />
          </div>
          <select 
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 focus:outline-none bg-white"
          >
            <option value="">All Departments</option>
            <option value="engineering">Engineering</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="hr">Human Resources</option>
            <option value="finance">Finance</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[220px]">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[100px]">Employee Id</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[110px]">Join Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[120px]">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[130px]">Offer Letter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[140px]">Relieving Letter</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {emp.profile_picture ? (
                            <img
                              src={emp.profile_picture}
                              alt={emp.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-indigo-600 text-xs font-semibold">{emp.name?.charAt(0)?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{emp.id}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(emp.join_date) || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      {emp.department ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-violet-50 text-violet-700 border border-violet-100">
                          {emp.department}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.position || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {emp.offer_letter_sent && (
                          <a href={emp.offer_letter_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="small">View</Button>
                          </a>
                        )}
                        <Button
                          size="small"
                          onClick={() => { setSelectedEmployee(emp); setIsOfferLetterModalOpen(true) }}
                        >
                          {emp.offer_letter_sent ? 'Regen' : 'Generate'}
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {emp.relieving_letter_sent && emp.relieving_letter_pdf_url && (
                          <a href={emp.relieving_letter_pdf_url} target="_blank" rel="noopener noreferrer">
                            <Button size="small">View</Button>
                          </a>
                        )}
                        <Button
                          size="small"
                          onClick={() => { setSelectedEmployee(emp); setIsRelievingLetterModalOpen(true) }}
                        >
                          {emp.relieving_letter_sent ? 'Regen' : 'Generate'}
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 relative" ref={openMenuId === emp.id ? menuRef : null}>
                      <button onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)}
                        className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 text-lg">⋮</button>
                      {openMenuId === emp.id && (
                        <div className="absolute right-8 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-32 py-1">
                          <button onClick={() => { handleEdit(emp); setOpenMenuId(null) }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-12 text-center text-gray-400 text-sm">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalRecords > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} employees
              </div>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalRecords}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          title="Edit Employee"
          open={isEditModalOpen}
          onCancel={() => setIsEditModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleSave}>
              Save Changes
            </Button>,
          ]}
          width={700}
        >
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input placeholder="John Doe" value={fv.name || ""} onChange={e => setFv('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <Input type="email" placeholder="john@example.com" value={fv.email || ""} onChange={e => setFv('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <Input placeholder="+91" value={fv.phone || ""} onChange={e => setFv('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <Select
                  placeholder="Select Gender"
                  value={fv.gender || undefined}
                  onChange={val => setFv('gender', val)}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <Input type="date" value={fv.join_date || ""} onChange={e => setFv('join_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Select
                  placeholder="Select Department"
                  value={fv.department || undefined}
                  onChange={val => setFv('department', val)}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'design', label: 'Design' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'hr', label: 'Human Resources' },
                    { value: 'finance', label: 'Finance' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <Input placeholder="Software Engineer" value={fv.position || ""} onChange={e => setFv('position', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input.TextArea placeholder="123 Main St, City, State, ZIP" value={fv.address || ""} onChange={e => setFv('address', e.target.value)} rows={3} />
            </div>
          </div>
        </Modal>

        {/* Add Modal */}
        <Modal
          title="Add New Employee"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={handleAdd} loading={loading}>
              Add Employee
            </Button>,
          ]}
          width={700}
        >
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input placeholder="John Doe" value={fv.name || ""} onChange={e => setFv('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <Input type="email" placeholder="john@example.com" value={fv.email || ""} onChange={e => setFv('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <Input placeholder="+91" value={fv.phone || ""} onChange={e => setFv('phone', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <Select
                  placeholder="Select Gender"
                  value={fv.gender || undefined}
                  onChange={val => setFv('gender', val)}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                <Input type="date" value={fv.join_date || ""} onChange={e => setFv('join_date', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <Select
                  placeholder="Select Department"
                  value={fv.department || undefined}
                  onChange={val => setFv('department', val)}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'engineering', label: 'Engineering' },
                    { value: 'design', label: 'Design' },
                    { value: 'marketing', label: 'Marketing' },
                    { value: 'hr', label: 'Human Resources' },
                    { value: 'finance', label: 'Finance' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <Input placeholder="Software Engineer" value={fv.position || ""} onChange={e => setFv('position', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input.TextArea placeholder="123 Main St, City, State, ZIP" value={fv.address || ""} onChange={e => setFv('address', e.target.value)} rows={3} />
            </div>
          </div>
        </Modal>

        {isOfferLetterModalOpen && selectedEmployee && (
          <OfferLetterModal employee={selectedEmployee}
            onClose={() => { setIsOfferLetterModalOpen(false); setSelectedEmployee(null) }}
            onSuccess={() => fetchEmployees()} />
        )}

        {isRelievingLetterModalOpen && selectedEmployee && (
          <RelievingLetterModal employee={selectedEmployee}
            onClose={() => { setIsRelievingLetterModalOpen(false); setSelectedEmployee(null) }}
            onSuccess={() => fetchEmployees()} />
        )}

        <ErrorCard type={errorCard.type} title={errorCard.title} message={errorCard.message}
          description={errorCard.description} buttonText={errorCard.buttonText}
          visible={errorCard.visible} onButtonClick={errorCard.onButtonClick}
          onClose={() => setErrorCard({ ...errorCard, visible: false })} />
      </div>

      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { background: '#fff', color: '#333', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
      }} />
    </div>
  )
}

export default EmployeeTable
