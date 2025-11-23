import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BookNow from './frontend/pages/BookNow';
import '../src/assets/css/frontend/style.css';
import '../src/assets/css/frontend/booking.css';
import Index from './frontend/pages/Index';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from './config';

// Quick runtime check for key mode (logs TEST/LIVE only)
if (typeof window !== 'undefined') {
  const mode = config.STRIPE_PUBLIC_KEY.startsWith('pk_live_') ? 'LIVE' : 'TEST';
  console.log(`[Stripe] Publishable key mode: ${mode}`);
}

const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

function App() {
  return (
    <div className="App">
      <Elements stripe={stripePromise}>
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/book" element={<BookNow />} />
              <Route path="/customerPortal/:token/index" element={<Index />} />
            </Routes>
        </BrowserRouter>
      </Elements>
    </div>
  );
}

export default App;
