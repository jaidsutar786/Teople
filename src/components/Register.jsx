import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendOTP, verifyOTPAndRegister, resendOTP } from "../api";
import toast, { Toaster } from 'react-hot-toast';
import logoImg from '../assets/Teople1.png';

const Register = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP Verification
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await sendOTP(email);
      setSuccess(data.message);
      toast.success('OTP sent successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      setOtpSent(true);
      setStep(2);
      setError("");
    } catch (err) {
      // Check if already registered
      if (err.code === 'already_registered') {
        setError(
          <span>
            {err.error}{' '}
            <Link to="/" className="font-semibold underline">
              Login here
            </Link>
          </span>
        );
      } else {
        setError(err.error || "Failed to send OTP");
      }
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await verifyOTPAndRegister(email, otp, username, password);
      setSuccess(data.message);
      toast.success('Account created successfully! Redirecting to login...', {
        position: 'top-right',
        duration: 3000,
      });
      setError("");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.error || "Verification failed");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await resendOTP(email);
      setSuccess(data.message);
      toast.success('OTP resent successfully!', {
        position: 'top-right',
        duration: 3000,
      });
      setError("");
    } catch (err) {
      setError(err.error || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      style={{
        background: `
      radial-gradient(circle at center, 
        #f0880a 0%, 
        #da6919 50%, 
        #df6b19 80%, 
        #bb5715 100%
      )
    `
      }}
      className="flex items-center justify-center min-h-screen px-4 py-3 transition-all duration-500 text-white"
    >
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full transition-all duration-300 ${darkMode
              ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
              : "bg-white hover:bg-gray-100 text-gray-700 shadow-md"
            }`}
        >
          {darkMode ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>

      <div
        className={`w-full max-w-xs rounded-xl shadow-xl p-6 transition-all duration-500 ${darkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
          }`}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-6">
          <img
            src={logoImg}
            alt="Company Logo"
            className="w-12 h-12 rounded-full object-cover mb-3"
          />
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"
            }`}>
            Register
          </h2>
          <p className={`mt-1 text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            Create your account
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`mb-3 p-2 rounded-lg text-xs font-medium text-center ${darkMode
              ? "bg-red-900/50 text-red-200 border border-red-800"
              : "bg-red-50 text-red-600 border border-red-200"
            }`}>
            {error}
          </div>
        )}
        {success && (
          <div className={`mb-3 p-2 rounded-lg text-xs font-medium text-center ${darkMode
              ? "bg-green-900/50 text-green-200 border border-green-800"
              : "bg-green-50 text-green-600 border border-green-200"
            }`}>
            {success}
          </div>
        )}

        {/* Form */}
        {step === 1 ? (
          // Step 1: Email Input
          <form className="space-y-4" onSubmit={handleSendOTP}>
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 ${darkMode
                    ? "border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-orange-600 text-white font-semibold py-2.5 text-sm rounded-lg hover:bg-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-md mt-6 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          // Step 2: OTP Verification & Registration
          <form className="space-y-4" onSubmit={handleVerifyAndRegister}>
            {/* OTP Input */}
            <div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                required
                maxLength={6}
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 text-center tracking-widest ${darkMode
                    ? "border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className={`text-xs font-medium hover:underline transition-colors ${darkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-500"
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Resend OTP
                </button>
              </div>
            </div>

            {/* Username */}
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                disabled={loading}
                className={`w-full px-3 py-2.5 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 ${darkMode
                    ? "border-gray-600 text-white placeholder-gray-400"
                    : "border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  disabled={loading}
                  className={`w-full px-3 py-2.5 pr-10 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 ${darkMode
                      ? "border-gray-600 text-white placeholder-gray-400"
                      : "border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 hover:opacity-70 transition-opacity"
                >
                  {showPassword ? (
                    <svg className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-orange-600 text-white font-semibold py-2.5 text-sm rounded-lg hover:bg-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-md mt-6 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className={`w-full text-sm font-medium transition-colors ${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-700"
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Footer */}
        <div className={`mt-6 pt-4 border-t text-center ${darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            Already have an account?
          </p>
          <Link
            to="/"
            className={`text-sm font-semibold hover:underline transition-colors ${darkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-500"
              }`}
          >
            Login
          </Link>
        </div>
      </div>

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
    </section>
  );
};

export default Register;