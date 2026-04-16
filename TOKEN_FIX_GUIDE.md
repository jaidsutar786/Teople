# JWT Token Error Fix Guide

## Problem
You're getting this error:
```json
{
    "detail": "Given token not valid for any token type",
    "code": "token_not_valid",
    "messages": [
        {
            "token_class": "AccessToken",
            "token_type": "access",
            "message": "Token is invalid"
        }
    ]
}
```

## Root Cause
Your **access token has expired** or is invalid. This happens when:
1. The token lifetime (1000 minutes) has passed
2. The token was corrupted in localStorage
3. The refresh token also expired

## Solutions (Try in Order)

### Solution 1: Clear Tokens and Re-login (Quickest)
```javascript
// Open browser console (F12) and run:
localStorage.clear();
window.location.href = '/login';
```

### Solution 2: Use Token Debug Utility
```javascript
// In your React component or browser console:
import { logTokenStatus, clearTokensAndRedirect } from './utils/tokenDebug';

// Check token status
logTokenStatus();

// If expired, clear and redirect
clearTokensAndRedirect();
```

### Solution 3: Manual Token Refresh
```javascript
// In browser console:
const refreshToken = localStorage.getItem('refreshToken');

fetch('http://127.0.0.1:8000/api/token/refresh/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh: refreshToken })
})
.then(res => res.json())
.then(data => {
  if (data.access) {
    localStorage.setItem('accessToken', data.access);
    console.log('✅ Token refreshed successfully');
    window.location.reload();
  } else {
    console.error('❌ Refresh failed:', data);
    localStorage.clear();
    window.location.href = '/login';
  }
})
.catch(err => {
  console.error('❌ Error:', err);
  localStorage.clear();
  window.location.href = '/login';
});
```

## What I Fixed in Your Code

### 1. Fixed Token Refresh Function (api.js)
```javascript
const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = '/login';
      return null;
    }

    // Use axios directly to avoid circular interceptor calls
    const response = await axios.post("http://127.0.0.1:8000/api/token/refresh/", { refresh: refreshToken });
    const newAccess = response.data.access;
    localStorage.setItem("accessToken", newAccess);
    return newAccess;
  } catch (err) {
    console.error("Failed to refresh token", err);
    localStorage.clear();
    window.location.href = '/login';
    return null;
  }
};
```

### 2. Improved Response Interceptor
```javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const newAccessToken = await refreshAccessToken();
      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } else {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Prevention Tips

### 1. Add Token Expiry Check Before API Calls
```javascript
import { checkTokenValidity } from './utils/tokenDebug';

// Before making API calls
const tokenStatus = checkTokenValidity();
if (!tokenStatus.valid) {
  // Try to refresh or redirect to login
  clearTokensAndRedirect();
}
```

### 2. Add Global Error Handler
```javascript
// In your App.jsx or main component
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Global error handler
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    });
  }, [navigate]);
  
  return <YourApp />;
}
```

### 3. Increase Token Lifetime (Optional)
In Django settings.py:
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),  # Increase from 1000 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),  # Increase from 7 days
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```

## Testing the Fix

1. **Clear browser cache and localStorage**
2. **Login again** to get fresh tokens
3. **Test API calls** - they should work now
4. **Check browser console** for any token-related errors

## Quick Commands

```bash
# In browser console (F12):

# Check if tokens exist
console.log('Access:', localStorage.getItem('accessToken'));
console.log('Refresh:', localStorage.getItem('refreshToken'));

# Clear everything and start fresh
localStorage.clear();
window.location.href = '/login';
```

## Backend Verification

Make sure your Django server is running:
```bash
cd manage
python manage.py runserver
```

Test the refresh endpoint:
```bash
curl -X POST http://127.0.0.1:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh": "YOUR_REFRESH_TOKEN_HERE"}'
```

## Summary

The issue is **expired/invalid access token**. The quickest fix is:
1. Open browser console (F12)
2. Run: `localStorage.clear(); window.location.href = '/login';`
3. Login again

Your token refresh logic is now fixed and will automatically handle expired tokens in the future.
