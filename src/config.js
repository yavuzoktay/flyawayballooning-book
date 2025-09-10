// Dynamic Configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  // Production environment - always use production URL for live site
  return 'https://flyawayballooning-system.com';
};

// Stripe publishable keys (make sure LIVE key belongs to the same Stripe account as the server's live secret key)
const TEST_PK = 'pk_test_51HjVLCHwUKMuFjtpkabkDGYDbjlEYMKZxLtmVrRxWNSJofcJuVeUKu4NNy0EvDN50DC4cfqf43X1x40BVThLCTRI0007TlISlC';
// TODO: Replace this placeholder with your real LIVE publishable key
const LIVE_PK = 'pk_live_REPLACE_WITH_YOUR_LIVE_KEY';

const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const config = {
  API_BASE_URL: getApiBaseUrl(),
  // Use TEST key locally; use LIVE key on production domain
  STRIPE_PUBLIC_KEY: isLocal ? TEST_PK : LIVE_PK
};

export default config; 