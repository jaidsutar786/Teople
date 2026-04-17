// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { loginUser } from "../api";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [darkMode, setDarkMode] = useState(false);

//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const data = await loginUser(email, password);

//       // Save user data
//       localStorage.setItem("isLoggedIn", "true");
//       localStorage.setItem("userId", data.user.id);
//       localStorage.setItem("full_name", data.user.full_name);
//       localStorage.setItem("role", data.user.role.toLowerCase());

//       // Save tokens
//       localStorage.setItem("accessToken", data.tokens.access);
//       localStorage.setItem("refreshToken", data.tokens.refresh);

//       // Redirect based on role
//       if (data.user.role === "admin") {
//         navigate("/dashboard");
//       } else if (data.user.role === "employee") {
//         navigate("/employee-home");
//       }
//     } catch (err) {
//       setError(err.error || "Invalid email or password");
//     }
//   };

//   return (
//     <section
//       className={`flex items-center justify-center min-h-screen transition-colors duration-500 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
//         }`}
//     >
//       {/* Theme Toggle */}
//       <div className="absolute top-4 right-4">
//         <label className="inline-flex items-center cursor-pointer">
//           <input
//             type="checkbox"
//             checked={darkMode}
//             onChange={() => setDarkMode(!darkMode)}
//             className="sr-only peer"
//           />
//           <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-500 relative">
//             <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
//           </div>
//         </label>
//       </div>

//       <div
//         className={`w-full max-w-md rounded-2xl shadow-lg p-8 ${darkMode ? "bg-gray-800" : "bg-white"
//           }`}
//       >
//         {/* Logo + Title */}
//         <div className="flex flex-col items-center mb-6">
//           {/* ✅ Apna Logo Add Kiya */}
//           <img
//             src="/src/assets/Teople1.png" // <-- yaha apne logo ka path dal
//             alt="Company Logo"
//             className="mb-3 w-12 h-12 object-contain" // ✅ size control, responsive
//           />

//           <h2 className="text-2xl font-bold">Sign in</h2>
//           <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
//             Welcome back! Please enter your details below to sign in.
//           </p>
//         </div>
//         {/* Error Message */}
//         {error && (
//           <p className="mb-4 text-sm text-red-500 text-center font-medium">
//             {error}
//           </p>
//         )}

//         {/* Form */}
//         <form className="space-y-5" onSubmit={handleLogin}>
//           <div>
//             <label className="block text-sm mb-1">Email</label>
//             <input
//               type="email"
//               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="Enter email"
//               required
//             />
//           </div>

//           <div>
//             <label className="block text-sm mb-1">Password</label>
//             <input
//               type="password"
//               className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               placeholder="Enter password"
//               required
//             />
//           </div>

//           <div className="flex items-center justify-between text-sm">
//             <label className="flex items-center space-x-2">
//               <input type="checkbox" className="w-4 h-4" />
//               <span>Remember me</span>
//             </label>
//             <a href="#" className="text-blue-500 hover:underline">
//               Forgot password?
//             </a>
//           </div>

//           <button
//             type="submit"
//             className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition"
//           >
//             Log in
//           </button>
//         </form>

//         {/* Footer */}
//         <p className="mt-6 text-sm text-center">
//           Don’t have an account?{" "}
//           <Link to="/register" className="text-blue-500 hover:underline">
//             Sign up now
//           </Link>
//         </p>
//       </div>
//     </section>
//   );
// };

// export default Login;




import logoImg from '../assets/Teople1.png';
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api";
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const role = localStorage.getItem("role");

    if (isLoggedIn === "true" && role) {
      if (role === "admin") {
        navigate("/admin-home", { replace: true });
      } else if (role === "employee") {
        navigate("/employee-home", { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);

      // Save user data
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("full_name", data.user.full_name);
      localStorage.setItem("role", data.user.role.toLowerCase());

      // Save tokens
      localStorage.setItem("accessToken", data.tokens.access);
      localStorage.setItem("refreshToken", data.tokens.refresh);

      // Show success message
      toast.success('Login successful!', {
        position: 'top-right',
        duration: 2000,
      });

      // Redirect based on role
      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/admin-home", { replace: true });
        } else if (data.user.role === "employee") {
          navigate("/employee-home", { replace: true });
        }
      }, 1000);
    } catch (err) {
      const errorMsg = err.error || "Invalid email or password";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: 'top-right',
        duration: 3000,
      });
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
        <div className="flex flex-col items-center mb-4">
          <img
            src={logoImg}
            alt="Company Logo"
            className="w-12 h-12 rounded-full object-cover mb-2"
          />
          <h2 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"
            }`}>
            Login
          </h2>
          <p className={`mt-0.5 text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            Login in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-3 p-2 rounded-lg text-xs font-medium text-center ${darkMode
            ? "bg-red-900/50 text-red-200 border border-red-800"
            : "bg-red-50 text-red-600 border border-red-200"
            }`}>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-3" onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              className={`w-full px-3 py-2.5 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 ${darkMode
                ? "border-gray-600 text-white placeholder-gray-400"
                : "border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              required
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full px-3 py-2.5 pr-10 text-sm border-b-2 bg-transparent focus:border-orange-500 outline-none transition-all duration-300 ${darkMode
                  ? "border-gray-600 text-white placeholder-gray-400"
                  : "border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
            className="w-full bg-orange-600 text-white font-semibold py-2.5 text-sm rounded-lg hover:bg-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-md mt-4"
          >
            Log In
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-3">
          <a
            href="#"
            className={`text-sm font-medium hover:underline transition-colors ${darkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-500"
              }`}
          >
            Forgot your password?
          </a>
        </div>

        {/* Footer */}
        <div className={`mt-4 pt-3 border-t text-center ${darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            Don't have an account?
          </p>
          <Link
            to="/register"
            className={`text-sm font-semibold hover:underline transition-colors ${darkMode ? "text-orange-400 hover:text-orange-300" : "text-orange-600 hover:text-orange-500"
              }`}
          >
            Register
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

export default Login;