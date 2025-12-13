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
// Test mode publishable key (for development only)
const TEST_PK = 'pk_test_51HjVLCHwUKMuFjtpkabkDGYDbjlEYMKZxLtmVrRxWNSJofcJuVeUKu4NNy0EvDN50DC4cfqf43X1x40BVThLCTRI0007TlISlC';

// Use live key in production, test key ONLY in localhost development
// Since backend is using live mode, frontend must also use live key in production
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const STRIPE_KEY = isLocalhost ? TEST_PK : LIVE_PK;

// Debug log to verify which key is being used
console.log('[Stripe Config] Hostname:', window.location.hostname);
console.log('[Stripe Config] Is Localhost:', isLocalhost);
console.log('[Stripe Config] Using key:', STRIPE_KEY.startsWith('pk_live_') ? 'LIVE' : 'TEST');
console.log('[Stripe Config] Key (first 20 chars):', STRIPE_KEY.substring(0, 20) + '...');

const config = {
  API_BASE_URL: getApiBaseUrl(),
  STRIPE_PUBLIC_KEY: STRIPE_KEY
};

export default config;
