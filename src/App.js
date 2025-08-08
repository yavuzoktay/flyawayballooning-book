import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BookNow from './frontend/pages/BookNow';
import '../src/assets/css/frontend/style.css';
import '../src/assets/css/frontend/booking.css';
import Index from './frontend/pages/Index';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import config from './config';

// Stripe initialized with config STRIPE_PUBLIC_KEY (test mode in prod)
const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

function App() {
  return (
    <div className="App">
      <Elements stripe={stripePromise}>
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/book" element={<BookNow />} />
              <Route path="/" element={<BookNow />} />
            </Routes>
        </BrowserRouter>
      </Elements>
    </div>
  );
}

export default App;
