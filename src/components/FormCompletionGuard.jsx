import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

const FormCompletionGuard = ({ children }) => {
  const [isFormComplete, setIsFormComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkFormCompletion();
  }, [location.pathname]);

  const checkFormCompletion = async () => {
    try {
      const response = await api.get('/employee-form/get/');
      setIsFormComplete(!!response.data?.personal_info);
    } catch (error) {
      setIsFormComplete(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isFormComplete) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600"></div>
          
          <div className="p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-2 border-orange-200"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-500 animate-spin"></div>
              <span className="text-2xl z-10">📝</span>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Complete Your Profile
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Please complete your profile to access all features.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-yellow-800 mb-2">
                <strong>Required Sections:</strong>
              </p>
              <div className="flex flex-wrap gap-1 justify-center">
                {['Personal', 'Documents', 'Education', 'Employment', 'Bank'].map((item, idx) => (
                  <span key={idx} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/employee-form')}
              className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-md font-medium text-sm"
            >
              Complete Profile Form
            </button>
            
            <p className="text-xs text-gray-500 mt-2">
              ⏱️ Takes only 5 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default FormCompletionGuard;