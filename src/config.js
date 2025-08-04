// Production Configuration
const config = {
  API_BASE_URL: process.env.REACT_APP_API_URL || 'https://flyawayballooning-system.com',
  STRIPE_PUBLIC_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_51OqJqpHwUKMuFjtp...' // Stripe public key'inizi buraya ekleyin
};

export default config; 