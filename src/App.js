import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BookNow from "./frontend/pages/BookNow";
import "../src/assets/css/frontend/style.css";
import "../src/assets/css/frontend/booking.css";
import Index from "./frontend/pages/Index";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import config from "./config";
import { captureGoogleAdsIds } from "./utils/googleAdsTracking";

// Capture gclid/wbraid/gbraid from URL for Google Ads conversion tracking
if (typeof window !== "undefined") {
  captureGoogleAdsIds();
}

const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

function App() {
  return (
    <div className="App">
      <Elements stripe={stripePromise}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hotel-manual-booking" element={<Index />} />
            <Route path="/thenewt" element={<Index />} />
            <Route path="/book" element={<BookNow />} />
            <Route path="/customerPortal/:token/index" element={<Index />} />
          </Routes>
        </BrowserRouter>
      </Elements>
    </div>
  );
}

export default App;
