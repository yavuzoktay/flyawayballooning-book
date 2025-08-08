// Dynamic Configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  // Production environment
  return process.env.REACT_APP_API_URL || 'https://flyawayballooning-system.com';
};

const config = {
  API_BASE_URL: getApiBaseUrl(),
  STRIPE_PUBLIC_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51HjVLCHwUKMuFjtp0QPX0KVZF1afEBmWUAcppWC6zTPum93jvgSUzd8X5dMQrLh3vaEUPruz5sgDY1jAbcf9pcuS00tmeruGek'
};

export default config; 