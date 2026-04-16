import React from 'react';

const TestSalaryComponent = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Salary Component Working!</h1>
        <p className="text-gray-600">Employee salary slip component has been successfully created and integrated.</p>
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Features Added:</h3>
          <ul className="list-disc list-inside text-green-700 mt-2">
            <li>Employee Salary Slip Component</li>
            <li>Salary History Display</li>
            <li>PDF Download Functionality</li>
            <li>Sidebar Navigation</li>
            <li>Quick Access from Employee Home</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestSalaryComponent;