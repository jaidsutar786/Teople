// Token debugging utility

export const checkTokenValidity = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) {
    console.error('❌ No tokens found in localStorage');
    return { valid: false, reason: 'No tokens found' };
  }
  
  try {
    // Decode JWT token (without verification)
    const base64Url = accessToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = payload.exp;
    const timeLeft = expiresAt - now;
    
    console.log('🔑 Token Info:');
    console.log('  - Expires at:', new Date(expiresAt * 1000).toLocaleString());
    console.log('  - Time left:', Math.floor(timeLeft / 60), 'minutes');
    console.log('  - User ID:', payload.user_id);
    
    if (timeLeft <= 0) {
      console.error('❌ Access token has expired');
      return { valid: false, reason: 'Token expired', timeLeft };
    }
    
    console.log('✅ Access token is valid');
    return { valid: true, timeLeft, payload };
    
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return { valid: false, reason: 'Invalid token format' };
  }
};

export const clearTokensAndRedirect = () => {
  console.log('🔄 Clearing tokens and redirecting to login...');
  localStorage.clear();
  window.location.href = '/';
};

export const logTokenStatus = () => {
  console.log('=== TOKEN STATUS ===');
  const result = checkTokenValidity();
  console.log('===================');
  return result;
};
