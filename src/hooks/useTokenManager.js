import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Custom hook to automatically handle token refresh and expiry
 * Usage: Add `useTokenManager()` in your App.jsx or main layout component
 */
export const useTokenManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check token validity on mount
    const checkAndRefreshToken = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        console.log('⚠️ No tokens found, redirecting to login...');
        navigate('/');
        return;
      }

      try {
        // Decode token to check expiry
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const payload = JSON.parse(jsonPayload);
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = payload.exp;
        const timeLeft = expiresAt - now;

        // If token expires in less than 5 minutes, refresh it
        if (timeLeft < 300) {
          console.log('🔄 Token expiring soon, refreshing...');
          
          try {
            const response = await axios.post(
              'http://127.0.0.1:8000/api/token/refresh/',
              { refresh: refreshToken }
            );
            
            localStorage.setItem('accessToken', response.data.access);
            console.log('✅ Token refreshed successfully');
          } catch (error) {
            console.error('❌ Token refresh failed:', error);
            localStorage.clear();
            navigate('/');
          }
        } else {
          console.log(`✅ Token valid for ${Math.floor(timeLeft / 60)} more minutes`);
        }
      } catch (error) {
        console.error('❌ Error checking token:', error);
        localStorage.clear();
        navigate('/');
      }
    };

    checkAndRefreshToken();

    // Check token every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  // Global error handler for 401 responses
  useEffect(() => {
    const handleUnauthorized = (event) => {
      if (event.reason?.response?.status === 401) {
        console.error('❌ Unauthorized request detected');
        localStorage.clear();
        navigate('/');
      }
    };

    window.addEventListener('unhandledrejection', handleUnauthorized);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnauthorized);
    };
  }, [navigate]);
};

/**
 * Utility function to manually refresh token
 */
export const manualRefreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token found');
  }

  try {
    const response = await axios.post(
      'http://127.0.0.1:8000/api/token/refresh/',
      { refresh: refreshToken }
    );
    
    localStorage.setItem('accessToken', response.data.access);
    console.log('✅ Token manually refreshed');
    return response.data.access;
  } catch (error) {
    console.error('❌ Manual token refresh failed:', error);
    localStorage.clear();
    window.location.href = '/';
    throw error;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  return !!(accessToken && refreshToken);
};
