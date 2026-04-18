import React, { useState, useEffect } from 'react';
import api from '../api';
import toast, { Toaster } from 'react-hot-toast';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button, Modal } from 'antd'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState('');
  const [incompleteFields, setIncompleteFields] = useState([]);

  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employee-form/all/');
      console.log('Employees data:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setEmployees(response.data.sort((a, b) => a.employee.id - b.employee.id));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    try {
      const response = await api.patch(`/employee-form/toggle-status/${employeeId}/`, {
        is_active: !currentStatus
      });
      console.log('Toggle response:', response.data);
      toast.success(`Employee ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, {
        position: 'top-right',
        duration: 3000,
      });
      await fetchEmployees();
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Failed to update employee status!', {
        position: 'top-right',
        duration: 3000,
      });
    }
  };

  const viewEmployeeDetails = (employee) => {
    setViewEmployee(employee);
    setShowModal(true);
  };

  const requestRevision = (employee) => {
    setViewEmployee(employee);
    setShowRevisionModal(true);
    setRevisionMessage('');
    setIncompleteFields([]);
  };

  const handleRevisionSubmit = async () => {
    if (!revisionMessage.trim()) {
      toast.error('Please enter a revision message!', {
        position: 'top-right',
        duration: 3000,
      });
      return;
    }
    
    try {
      await api.post(`/employee-form/request-revision/${viewEmployee.employee.id}/`, {
        message: revisionMessage,
        incomplete_fields: incompleteFields
      });
      toast.success('Revision request sent successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      setShowRevisionModal(false);
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error requesting revision:', error);
      toast.error('Failed to send revision request!', {
        position: 'top-right',
        duration: 3000,
      });
    }
  };

  const toggleIncompleteField = (field) => {
    setIncompleteFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const filtered = employees.filter(emp => {
    const name = `${emp.personal_info?.first_name || emp.employee.first_name} ${emp.personal_info?.last_name || emp.employee.last_name}`.toLowerCase()
    const id = (emp.employee.employee_id || '').toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || id.includes(q)
  })

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;
  }

  return (
    <div>
      <div className="p-6 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 w-60 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Employee Id</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((emp) => {
                  const name = `${emp.personal_info?.first_name || emp.employee.first_name} ${emp.personal_info?.last_name || emp.employee.last_name}`
                  return (
                    <tr key={emp.employee.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-900">{emp.employee.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {emp.employee.profile_picture ? (
                              <img src={emp.employee.profile_picture} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-600 text-xs font-semibold">{name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{emp.employee.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 capitalize">{emp.employee.department || <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          emp.employee.is_active ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {emp.employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="small"
                            onClick={() => viewEmployeeDetails(emp)}
                          >
                            View
                          </Button>
                          {emp.employee.is_active ? (
                            <Button
                              size="small"
                              danger
                              onClick={() => toggleEmployeeStatus(emp.employee.id, emp.employee.is_active)}
                            >
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => toggleEmployeeStatus(emp.employee.id, emp.employee.is_active)}
                            >
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-sm">No employees found</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal
        title="Employee Details"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={[
          <Button key="revision" onClick={() => requestRevision(viewEmployee)}>
            🔄 Request Form Revision
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowModal(false)}>
            Close
          </Button>,
        ]}
        width={1000}
        centered
        style={{ top: 20 }}
      >
        {viewEmployee && (
          <div className="space-y-6 mt-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Personal Info */}
              {viewEmployee.personal_info && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>👤</span> Personal Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <InfoItem label="First Name" value={viewEmployee.personal_info.first_name} />
                    <InfoItem label="Middle Name" value={viewEmployee.personal_info.middle_name} />
                    <InfoItem label="Last Name" value={viewEmployee.personal_info.last_name} />
                    <InfoItem label="Date of Birth" value={viewEmployee.personal_info.date_of_birth} />
                    <InfoItem label="Gender" value={viewEmployee.personal_info.gender} />
                    <InfoItem label="Marital Status" value={viewEmployee.personal_info.marital_status} />
                    <InfoItem label="Nationality" value={viewEmployee.personal_info.nationality} />
                    <InfoItem label="Father's/Mother's Name" value={viewEmployee.personal_info.parent_name} />
                    <InfoItem label="Contact Number" value={viewEmployee.personal_info.contact_number} />
                    <InfoItem label="Alternate Number" value={viewEmployee.personal_info.alternate_number} />
                    <InfoItem label="Personal Email" value={viewEmployee.personal_info.personal_email} />
                    <InfoItem label="Blood Group" value={viewEmployee.personal_info.blood_group} />
                  </div>
                </div>
              )}

              {/* Address & Emergency Contact */}
              {viewEmployee.personal_info && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🏠</span> Address & Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2"><InfoItem label="Permanent Address" value={viewEmployee.personal_info.permanent_address} /></div>
                    <div className="col-span-2"><InfoItem label="Current Address" value={viewEmployee.personal_info.current_address} /></div>
                    <InfoItem label="Emergency Contact Name" value={viewEmployee.personal_info.emergency_contact_name} />
                    <InfoItem label="Emergency Contact Number" value={viewEmployee.personal_info.emergency_contact_number} />
                  </div>
                </div>
              )}

              {/* Document Numbers */}
              {viewEmployee.personal_info && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🆔</span> Document Numbers
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <InfoItem label="Aadhar Number" value={viewEmployee.personal_info.aadhar_number} />
                    <InfoItem label="PAN Number" value={viewEmployee.personal_info.pan_number} />
                    <InfoItem label="Passport Number" value={viewEmployee.personal_info.passport_number} />
                  </div>
                </div>
              )}

              {/* Education */}
              {viewEmployee.personal_info && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🎓</span> Educational Qualifications
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <InfoItem label="10th Marks" value={viewEmployee.personal_info.tenth_marks} />
                    <InfoItem label="10th Year" value={viewEmployee.personal_info.tenth_year} />
                    <InfoItem label="12th Marks" value={viewEmployee.personal_info.twelfth_marks} />
                    <InfoItem label="12th Year" value={viewEmployee.personal_info.twelfth_year} />
                    <InfoItem label="Highest Qualification" value={viewEmployee.personal_info.highest_qualification} />
                    <InfoItem label="Marks/CGPA" value={viewEmployee.personal_info.highest_qualification_marks} />
                    <InfoItem label="Year" value={viewEmployee.personal_info.highest_qualification_year} />
                    <InfoItem label="University Name" value={viewEmployee.personal_info.university_name} />
                  </div>
                </div>
              )}

              {/* Bank Details */}
              {viewEmployee.personal_info && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🏦</span> Bank Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <InfoItem label="Bank Name" value={viewEmployee.personal_info.bank_name} />
                    <InfoItem label="Account Number" value={viewEmployee.personal_info.account_number} />
                    <InfoItem label="IFSC Code" value={viewEmployee.personal_info.ifsc_code} />
                    <InfoItem label="Account Holder Name" value={viewEmployee.personal_info.account_holder_name} />
                    <InfoItem label="PAN Number" value={viewEmployee.personal_info.pan_number_bank} />
                    <InfoItem label="UAN Number" value={viewEmployee.personal_info.uan_number} />
                    <InfoItem label="ESIC Number" value={viewEmployee.personal_info.esic_number} />
                    <InfoItem label="Tax Regime" value={viewEmployee.personal_info.tax_regime} />
                  </div>
                </div>
              )}

              {/* Documents */}
              {viewEmployee.documents && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>📄</span> Documents
                  </h3>
                  
                  {/* Personal Documents */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">Personal Documents</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {viewEmployee.documents.aadhar_pdf && <DocLink label="Aadhar" url={viewEmployee.documents.aadhar_pdf} />}
                      {viewEmployee.documents.pan_pdf && <DocLink label="PAN" url={viewEmployee.documents.pan_pdf} />}
                      {viewEmployee.documents.passport_pdf && <DocLink label="Passport" url={viewEmployee.documents.passport_pdf} />}
                    </div>
                  </div>
                  
                  {/* Educational Documents */}
                  <div className="mb-3">
                    <p className="text-xs font-bold text-gray-600 mb-2">Educational Documents</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {viewEmployee.documents.tenth_marksheet && <DocLink label="10th Marksheet" url={viewEmployee.documents.tenth_marksheet} />}
                      {viewEmployee.documents.twelfth_marksheet && <DocLink label="12th Marksheet" url={viewEmployee.documents.twelfth_marksheet} />}
                      {viewEmployee.documents.highest_qualification_doc && <DocLink label="Highest Qualification" url={viewEmployee.documents.highest_qualification_doc} />}
                      {viewEmployee.documents.additional_certifications && <DocLink label="Certifications" url={viewEmployee.documents.additional_certifications} />}
                      {viewEmployee.documents.skill_certificates && <DocLink label="Skill Certificates" url={viewEmployee.documents.skill_certificates} />}
                    </div>
                  </div>
                  
                  {/* Employment Documents - Company 1 */}
                  {(viewEmployee.documents.company1_offer_letter || viewEmployee.documents.company1_experience_letter || viewEmployee.documents.company1_salary_slips) && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-600 mb-2">Company 1 Documents</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {viewEmployee.documents.company1_offer_letter && <DocLink label="Offer Letter" url={viewEmployee.documents.company1_offer_letter} />}
                        {viewEmployee.documents.company1_experience_letter && <DocLink label="Experience Letter" url={viewEmployee.documents.company1_experience_letter} />}
                        {viewEmployee.documents.company1_salary_slips && <DocLink label="Salary Slips" url={viewEmployee.documents.company1_salary_slips} />}
                      </div>
                    </div>
                  )}
                  
                  {/* Employment Documents - Company 2 */}
                  {(viewEmployee.documents.company2_offer_letter || viewEmployee.documents.company2_experience_letter || viewEmployee.documents.company2_salary_slips) && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-600 mb-2">Company 2 Documents</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {viewEmployee.documents.company2_offer_letter && <DocLink label="Offer Letter" url={viewEmployee.documents.company2_offer_letter} />}
                        {viewEmployee.documents.company2_experience_letter && <DocLink label="Experience Letter" url={viewEmployee.documents.company2_experience_letter} />}
                        {viewEmployee.documents.company2_salary_slips && <DocLink label="Salary Slips" url={viewEmployee.documents.company2_salary_slips} />}
                      </div>
                    </div>
                  )}
                  
                  {/* Bank Documents */}
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-2">Bank Documents</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {viewEmployee.documents.bank_document && <DocLink label="Bank Document" url={viewEmployee.documents.bank_document} />}
                    </div>
                  </div>
                </div>
              )}

              {/* Employment History */}
              {viewEmployee.personal_info && (viewEmployee.personal_info.company1_name || viewEmployee.personal_info.company2_name) && (
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>💼</span> Previous Employment
                  </h3>
                  <div className="space-y-3">
                    {viewEmployee.personal_info.company1_name && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-semibold text-gray-800">{viewEmployee.personal_info.company1_name}</p>
                        <p className="text-sm text-gray-600">Experience: {viewEmployee.personal_info.company1_experience}</p>
                        <p className="text-xs text-gray-500">{viewEmployee.personal_info.company1_from_date} to {viewEmployee.personal_info.company1_to_date}</p>
                      </div>
                    )}
                    {viewEmployee.personal_info.company2_name && (
                      <div className="bg-white p-3 rounded border">
                        <p className="font-semibold text-gray-800">{viewEmployee.personal_info.company2_name}</p>
                        <p className="text-sm text-gray-600">Experience: {viewEmployee.personal_info.company2_experience}</p>
                        <p className="text-xs text-gray-500">{viewEmployee.personal_info.company2_from_date} to {viewEmployee.personal_info.company2_to_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* Revision Request Modal */}
      <Modal
        title="Request Form Revision"
        open={showRevisionModal}
        onCancel={() => setShowRevisionModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowRevisionModal(false)}>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleRevisionSubmit}>
            Send Request
          </Button>,
        ]}
        width={900}
        centered
        style={{ top: 20 }}
      >
        <div className="space-y-4 mt-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Revision Message *</label>
                <textarea
                  value={revisionMessage}
                  onChange={(e) => setRevisionMessage(e.target.value)}
                  placeholder="Please complete the following fields..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Incomplete Fields</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {[
                    'First Name', 'Middle Name', 'Last Name', 'Date of Birth', 'Gender', 'Marital Status',
                    'Nationality', 'Father/Mother Name', 'Contact Number', 'Alternate Number', 'Personal Email',
                    'Permanent Address', 'Current Address', 'Emergency Contact Name', 'Emergency Contact Number',
                    'Blood Group', 'Aadhar Number', 'PAN Number', 'Passport Number',
                    '10th Marks', '10th Year', '10th Marksheet', '12th Marks', '12th Year', '12th Marksheet',
                    'Highest Qualification', 'Qualification Marks', 'Qualification Year', 'University Name',
                    'Highest Qualification Document', 'Additional Certifications', 'Skill Certificates',
                    'Experience Type', 'Company 1 Name', 'Company 1 Experience', 'Company 1 From Date', 'Company 1 To Date',
                    'Company 1 Offer Letter', 'Company 1 Experience Letter', 'Company 1 Salary Slips',
                    'Company 2 Name', 'Company 2 Experience', 'Company 2 From Date', 'Company 2 To Date',
                    'Company 2 Offer Letter', 'Company 2 Experience Letter', 'Company 2 Salary Slips',
                    'Bank Name', 'Account Number', 'IFSC Code', 'Account Holder Name', 'PAN Number (Bank)',
                    'UAN Number', 'ESIC Number', 'Tax Regime', 'Bank Document',
                    'Aadhar Document', 'PAN Document', 'Passport Document'
                  ].map(field => (
                    <label key={field} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={incompleteFields.includes(field)}
                        onChange={() => toggleIncompleteField(field)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-700">{field}</span>
                    </label>
                  ))}
                </div>
              </div>

              {incompleteFields.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-orange-800 mb-2">Selected Fields ({incompleteFields.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {incompleteFields.map(field => (
                      <span key={field} className="px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded-full">
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
        </div>
      </Modal>
      
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 font-semibold">{label}</p>
    <p className="text-sm text-gray-800 font-medium break-words">{value || 'N/A'}</p>
  </div>
);

const DocLink = ({ label, url }) => (
  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
    <span className="text-lg">📄</span>
    <span className="text-xs font-semibold text-blue-600 hover:underline">{label}</span>
  </a>
);

export default EmployeeManagement;
