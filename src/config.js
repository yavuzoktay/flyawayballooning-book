// Dynamic Configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  // Production environment
  return process.env.REACT_APP_API_URL || 'https://flyawayballooning-system.com';
};

// Use the complete publishable key from the same account as the secret key
const TEST_PK = 'pk_test_51HjVLCHwUKMuFjtpdTxV53bl86vwIpXiNUHurZhSFIVUFGnDBJWZIlBnxMhdpD1ifnsbrHxIvRbNKfRGxd7eOWyy00bJWj8Je1';

const config = {
  API_BASE_URL: getApiBaseUrl(),
  STRIPE_PUBLIC_KEY: TEST_PK
};

export default config; 