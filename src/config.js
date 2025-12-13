// Dynamic Configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  // Production environment - always use production URL for live site
  return 'https://flyawayballooning-system.com';
};

// Use the complete publishable key from the same account as the secret key
// Live mode publishable key (matches the live secret key in backend)
const LIVE_PK = 'pk_live_51HjVLCHwUKMuFjtpYqU29dM4gqkLTiwG2zsgCtSfRe2Ehj44Ewpd3UpRAb3lc8PiOsKwGsIcOSD7XR6FmaVaoHHK00AcQ8TPsF';
// Test mode publishable key (for development)
const TEST_PK = 'pk_test_51HjVLCHwUKMuFjtpkabkDGYDbjlEYMKZxLtmVrRxWNSJofcJuVeUKu4NNy0EvDN50DC4cfqf43X1x40BVThLCTRI0007TlISlC';

// Use live key in production, test key in development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const STRIPE_KEY = isProduction ? LIVE_PK : TEST_PK;

const config = {
  API_BASE_URL: getApiBaseUrl(),
  STRIPE_PUBLIC_KEY: STRIPE_KEY
};

export default config;