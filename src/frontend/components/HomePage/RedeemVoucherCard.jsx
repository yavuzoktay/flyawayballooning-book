import React, { useState, useEffect } from "react";

const RedeemVoucherCard = ({ onSubmit }) => {
  const [voucherCode, setVoucherCode] = useState("");

  // Input alanı otomatik olarak odaklanacak
  useEffect(() => {
    const timer = setTimeout(() => {
      const inputElement = document.getElementById("voucher-code-input");
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBackToCard = () => {
    // Find the back-to-front element and trigger its click event
    const backToFrontElement = document.querySelector('.back-to-front');
    if (backToFrontElement) {
      backToFrontElement.click();
    }
  };

  const handleSubmit = (e) => {
    // Completely stop event propagation and prevent default
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    
    if (voucherCode.trim()) {
      try {
        // Just store the voucher code but don't navigate away
        if (typeof onSubmit === 'function') {
          onSubmit(voucherCode);
        }
      } catch (error) {
        console.error('Error submitting voucher:', error);
      }
      
      // Immediately flip back to card view
      handleBackToCard();
      
      // Return false to prevent further event handling
      return false;
    } else {
      // Input boşsa uyarı göster
      alert("Please enter a voucher code");
      return false;
    }
  };

  const handleKeyDown = (e) => {
    // If Enter key is pressed in the input field
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="voucher-card-container">
      <div className="voucher-label" style={{ color: "#0d47a1", fontSize: "18px", fontWeight: "500", marginBottom: "20px", textAlign: "center", width: '100%' }}>
        Enter Voucher Code
      </div>
      <input
        id="voucher-code-input"
        type="text"
        value={voucherCode}
        onChange={(e) => setVoucherCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="voucher-input-field"
        style={{ width: '100%', marginBottom: '25px' }}
      />
      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: "#2196f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "10px 30px",
          fontSize: "16px",
          fontWeight: "500",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          cursor: "pointer",
          lineHeight: "1.5",
          marginBottom: "15px"
        }}
      >
        Redeem
      </button>
      <button
        onClick={handleBackToCard}
        style={{
          backgroundColor: "transparent",
          color: "#0d47a1",
          border: "1px solid #0d47a1",
          borderRadius: "4px",
          padding: "8px 20px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          lineHeight: "1.5"
        }}
      >
        Back to Card
      </button>
    </div>
  );
};

export default RedeemVoucherCard; 