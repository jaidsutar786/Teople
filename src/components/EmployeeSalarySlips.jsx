import { useState, useEffect } from 'react';
import { getMonthlySalaryHistory, downloadProfessionalSalarySlip, getEmployees } from '../api';
import { toast } from 'react-hot-toast';
import { ArrowDownTrayIcon, DocumentTextIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';

const EmployeeSalarySlips = () => {
  const [salarySlips, setSalarySlips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);

  useEffect(() => {
    fetchSalarySlips();
  }, []);

  const fetchSalarySlips = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.id;
      
      const employees = await getEmployees();
      const currentEmployee = employees.find(emp => emp.user_id === userId);
      
      if (!currentEmployee) {
        toast.error('Employee record not found');
        return;
      }
      
      // Use getMonthlySalaryHistory instead
      const salaryHistory = await getMonthlySalaryHistory(currentEmployee.id);
      setSalarySlips(salaryHistory);
    } catch (error) {
      console.error('❌ Error fetching salary slips:', error);
      toast.error('Failed to load salary slips');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (slip) => {
    try {
      setDownloadingId(slip.id);
      console.log(`📥 Downloading slip for month: ${slip.month}, year: ${slip.year}`);
      
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = user.id;
      const employees = await getEmployees();
      const currentEmployee = employees.find(emp => emp.user_id === userId);
      
      // Fixed: slip.month is already 1-indexed (1-12), don't add 1
      await downloadProfessionalSalarySlip(currentEmployee.id, slip.month, slip.year);
      toast.success('Salary slip downloaded successfully!');
    } catch (error) {
      console.error('❌ Error downloading salary slip:', error);
      toast.error(error.response?.data?.error || 'Failed to download salary slip');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatMonth = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // month is 1-indexed (1-12), so subtract 1 for array access
    return months[month - 1] || 'Invalid';
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading salary slips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                My Salary Slips
              </h1>
              <p className="text-gray-600 mt-2">View and download your monthly salary slips</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Slips</p>
              <p className="text-3xl font-bold text-blue-600">{salarySlips.length}</p>
            </div>
          </div>
        </div>

        {salarySlips.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <DocumentTextIcon className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Salary Slips Available</h3>
            <p className="text-gray-600">Your salary slips will appear here once they are generated</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Period</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Gross Salary</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Tax</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Final Salary</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Days</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salarySlips.map((slip, index) => (
                    <tr key={slip.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{formatMonth(slip.month)} {slip.year}</p>
                            <p className="text-xs text-gray-500">Slip #{salarySlips.length - index}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(slip.gross_monthly_salary)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(slip.professional_tax)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-lg font-bold text-green-600">{formatCurrency(slip.final_salary)}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-blue-700">{slip.present_days}</span>
                          <span className="text-xs text-blue-600">/{slip.total_working_days}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewingSlip(slip)}
                            className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownload(slip)}
                            disabled={downloadingId === slip.id}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingId === slip.id ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-700 border-t-transparent"></div>
                            ) : (
                              <ArrowDownTrayIcon className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* View Slip Modal */}
      {viewingSlip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Salary Slip</h3>
                  <p className="text-blue-100">{formatMonth(viewingSlip.month)} {viewingSlip.year}</p>
                </div>
                <button
                  onClick={() => setViewingSlip(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-700 mb-1">Final Salary</p>
                <p className="text-3xl font-bold text-green-700">{formatCurrency(viewingSlip.final_salary)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">Gross Salary</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(viewingSlip.gross_monthly_salary)}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-xs text-red-600 mb-1">Professional Tax</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(viewingSlip.professional_tax)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Attendance Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Working Days</span>
                    <span className="font-semibold">{viewingSlip.total_working_days}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Present Days</span>
                    <span className="font-semibold text-green-700">{viewingSlip.present_days}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">WFH Days</span>
                    <span className="font-semibold text-blue-700">{viewingSlip.wfh_days}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-gray-600">Half Days</span>
                    <span className="font-semibold text-yellow-700">{viewingSlip.half_days}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-600">Leave Days</span>
                    <span className="font-semibold text-orange-700">{viewingSlip.leave_days}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm text-gray-600">Comp Off Used</span>
                    <span className="font-semibold text-purple-700">{viewingSlip.comp_off_used}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setViewingSlip(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleDownload(viewingSlip);
                    setViewingSlip(null);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSalarySlips;
