import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BookNow from './frontend/pages/BookNow';
import '../src/assets/css/frontend/style.css';
import '../src/assets/css/frontend/booking.css';
import Index from './frontend/pages/Index';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Updated for Stripe checkout fix - 2025-08-08
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

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
