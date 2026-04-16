import React, { useState, useEffect } from 'react';
import { getSalaries, getMonthlySalaryHistory } from '../api';

const DebugUserInfo = () => {
  const [allSalaries, setAllSalaries] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');
  const employeeId = user.id || userId;

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const salaries = await getSalaries();
      setAllSalaries(salaries);
      
      if (employeeId) {
        try {
          const history = await getMonthlySalaryHistory(employeeId);
          setSalaryHistory(history);
        } catch (error) {
          console.log('No salary history for employee:', employeeId);
        }
      }
    } catch (error) {
      console.error('Error fetching debug data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  const currentEmployeeSalary = allSalaries.find(salary => 
    salary.employee === parseInt(employeeId) || 
    salary.employee_id === employeeId ||
    salary.employee?.id === parseInt(employeeId)
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Debug User & Salary Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-3">User Object from localStorage</h3>
              <pre className="text-sm text-blue-700 overflow-auto max-h-40">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-3">Individual localStorage Items</h3>
              <div className="space-y-2 text-sm">
                <p><strong>userId:</strong> {userId}</p>
                <p><strong>role:</strong> {role}</p>
                <p><strong>isLoggedIn:</strong> {localStorage.getItem('isLoggedIn')}</p>
                <p><strong>full_name:</strong> {localStorage.getItem('full_name')}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-3">Employee ID Detection</h3>
            <div className="text-sm text-yellow-700">
              <p><strong>user.id:</strong> {user.id}</p>
              <p><strong>user.employee_id:</strong> {user.employee_id}</p>
              <p><strong>userId from localStorage:</strong> {userId}</p>
              <p><strong>Detected Employee ID:</strong> {employeeId || 'Not Found'}</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading salary data...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-3">Current Employee Salary Match</h3>
                {currentEmployeeSalary ? (
                  <pre className="text-sm text-purple-700 overflow-auto max-h-40">
                    {JSON.stringify(currentEmployeeSalary, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-600">No salary record found for employee ID: {employeeId}</p>
                )}
              </div>

              <div className="mb-6 bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-3">All Salaries ({allSalaries.length})</h3>
                <div className="max-h-60 overflow-auto">
                  {allSalaries.map((salary, index) => (
                    <div key={index} className="mb-2 p-2 bg-white rounded border text-sm">
                      <p><strong>ID:</strong> {salary.id} | <strong>Employee:</strong> {salary.employee} | <strong>Employee ID:</strong> {salary.employee_id} | <strong>Name:</strong> {salary.employee_name}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-3">Salary History ({salaryHistory.length})</h3>
                {salaryHistory.length > 0 ? (
                  <div className="max-h-40 overflow-auto">
                    {salaryHistory.map((record, index) => (
                      <div key={index} className="mb-1 text-sm text-red-700">
                        {record.month}/{record.year} - ₹{record.final_salary}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-600">No salary history found for employee ID: {employeeId}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugUserInfo;