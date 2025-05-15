import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import BookNow from './frontend/pages/BookNow';
import '../src/assets/css/frontend/style.css';
import '../src/assets/css/frontend/booking.css';
import Index from './frontend/pages/Index';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/book" element={<BookNow />} />
            <Route path="/" element={<BookNow />} />
          </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
