import React, { useState, useEffect } from 'react';
import { 
  getMonthlySalaryHistory, 
  downloadSalarySlipByDetails,
  getSalaries
} from '../api';
import { DocumentArrowDownIcon, CalendarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const EmployeeSalarySlip = () => {
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(null);
  const [employeeInfo, setEmployeeInfo] = useState(null);

  useEffect(() => {
    loadEmployeeSalaryData();
  }, []);

  const loadEmployeeSalaryData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const userId = localStorage.getItem('userId');
      
      if (!user && !userId) {
        toast.error('User information not found');
        return;
      }

      const employeeId = user?.id || userId;
      
      if (!employeeId) {
        toast.error('Employee ID not found');
        return;
      }

      console.log('Loading salary data for employee ID:', employeeId);

      // Get all salaries and find current employee's salary
      try {
        const allSalaries = await getSalaries();
        console.log('All salaries:', allSalaries);
        console.log('Looking for employee ID:', employeeId);
        
        const currentEmployeeSalary = allSalaries.find(salary => 
          salary.employee === parseInt(employeeId) || 
          salary.employee_id === parseInt(employeeId)
        );
        
        if (currentEmployeeSalary) {
          setEmployeeInfo(currentEmployeeSalary);
          console.log('Found salary for employee:', currentEmployeeSalary);
          
          // Get salary history using correct employee ID
          try {
            const correctEmployeeId = currentEmployeeSalary.employee;
            const history = await getMonthlySalaryHistory(correctEmployeeId);
            setSalaryHistory(history);
            console.log('Salary history found:', history);
          } catch (historyError) {
            console.log('No salary history found for employee:', correctEmployeeId);
            setSalaryHistory([]);
          }
        } else {
          console.log('No salary found for employee ID:', employeeId);
          console.log('Available employee IDs:', allSalaries.map(s => s.employee));
        }
      } catch (salaryError) {
        console.log('Error fetching salaries:', salaryError);
      }
      
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (month, year) => {
    try {
      setDownloadingPDF(`${month}-${year}`);
      
      const employeeId = employeeInfo?.employee;
      
      if (!employeeId) {
        toast.error('Employee ID not found');
        return;
      }
      
      console.log('Downloading PDF for employee:', employeeId, 'Month:', month, 'Year:', year);
      await downloadSalarySlipByDetails(employeeId, month, year);
      toast.success('Salary slip downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      if (error.response?.status === 404) {
        toast.error('Salary slip not found for this month');
      } else {
        toast.error('Failed to download salary slip');
      }
    } finally {
      setDownloadingPDF(null);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your salary information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 mr-3 text-green-600" />
                My Salary Slips
              </h1>
              <p className="text-gray-600 mt-2">View and download your monthly salary slips</p>
            </div>
            {employeeInfo && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Employee</p>
                <p className="text-lg font-semibold text-gray-900">{employeeInfo.employee_name}</p>
                <p className="text-sm text-gray-600 mt-1">Monthly Salary: ₹{employeeInfo.monthly_salary?.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Salary History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-100 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="h-6 w-6 mr-2 text-green-600" />
              Salary History
              <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                {salaryHistory.length} records
              </span>
            </h2>
          </div>

          {salaryHistory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50">
              <CurrencyDollarIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600 text-lg">No salary records found</p>
              <p className="text-gray-500 text-sm mt-2">Your salary slips will appear here once generated by admin</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg max-w-md mx-auto">
                <p className="text-blue-700 text-sm">
                  <strong>Note:</strong> Salary slips are generated by the admin after processing monthly attendance and salary calculations.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Month & Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Working Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Present Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Leave Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      WFH Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Comp Off Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Final Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Generated On
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Download
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryHistory.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getMonthName(record.month)} {record.year}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.total_working_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {record.present_days}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.leave_days || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.wfh_days || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {record.comp_off_used || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          ₹{Number(record.final_salary).toLocaleString('en-IN', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(record.generated_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDownloadPDF(record.month, record.year)}
                          disabled={downloadingPDF === `${record.month}-${record.year}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Download Salary Slip"
                        >
                          {downloadingPDF === `${record.month}-${record.year}` ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                              Download PDF
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {salaryHistory.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Records</p>
                  <p className="text-2xl font-bold text-gray-900">{salaryHistory.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Latest Salary</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{salaryHistory.length > 0 ? 
                      Number(salaryHistory[0].final_salary).toLocaleString('en-IN') : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <DocumentArrowDownIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available Downloads</p>
                  <p className="text-2xl font-bold text-gray-900">{salaryHistory.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalarySlip;