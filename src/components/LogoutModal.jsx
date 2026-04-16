import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 relative">
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full opacity-30"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-400 rounded-full opacity-20"></div>
          <h2 className="text-lg font-bold text-white text-center">Success!</h2>
        </div>

        <div className="p-6 text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-pulse"></div>
              <span className="text-2xl z-10">✅</span>
            </div>
            <div className="flex justify-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Profile Completed!
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Your profile has been submitted successfully. Please logout and login again.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-800">
              <strong>Next Steps:</strong><br/>
              Logout → Login → Access Features
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md font-medium text-sm"
          >
            Logout & Login Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;