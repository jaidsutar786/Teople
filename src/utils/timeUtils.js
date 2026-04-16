// IST Time Utility Functions

export const getClientISTTime = (date = new Date()) => {
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(date.getTime() + istOffset);
  
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const year = istTime.getUTCFullYear();
  
  let hours = istTime.getUTCHours();
  const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  
  return `${day}-${month}-${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm} IST`;
};

export const formatISTTime = (dateString) => {
  if (!dateString) return '';
  if (dateString.includes('IST')) return dateString;
  
  const date = new Date(dateString);
  return getClientISTTime(date);
};
