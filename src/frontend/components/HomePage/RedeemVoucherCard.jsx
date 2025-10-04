import React, { useState, useEffect } from "react";

const RedeemVoucherCard = ({ onSubmit, voucherStatus, voucherData, onValidate }) => {
  const [localVoucherCode, setLocalVoucherCode] = useState("");

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
    
    if (localVoucherCode.trim()) {
      try {
        // Validate voucher code first
        if (typeof onValidate === 'function') {
          onValidate(localVoucherCode);
        }
        
        // Don't flip back immediately - wait for validation result
        // The card will flip back when voucherStatus changes to 'valid'
        
        // Just store the voucher code
        if (typeof onSubmit === 'function') {
          onSubmit(localVoucherCode);
        }
      } catch (error) {
        console.error('Error submitting voucher:', error);
        // Flip back on error
        handleBackToCard();
      }
      
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
    <div className="voucher-card-container" style={{ width: '100%', maxWidth: '100%' }}>
      <div className="voucher-label" style={{ 
        color: "#0d47a1", 
        fontSize: "16px", 
        fontWeight: "500", 
        marginBottom: "8px", 
        textAlign: "center", 
        width: '100%',
        lineHeight: '1.3'
      }}>
        Enter Voucher Code
      </div>
      <input
        id="voucher-code-input"
        type="text"
        value={localVoucherCode}
        onChange={(e) => setLocalVoucherCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="voucher-input-field"
        style={{ 
          width: '85%', 
          margin: '16px auto 20px auto', 
          display: 'block',
          padding: '8px 12px',
          fontSize: '14px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.stopPropagation()}
        placeholder="Enter voucher code..."
      />
      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: "#2196f3",
          color: "white", 
          border: "none",
          borderRadius: "4px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          cursor: "pointer",
          lineHeight: "1.4",
          marginBottom: "12px",
          minWidth: "60px"
        }}
      >
        Redeem
      </button>

      {/* Voucher Status Display */}
      {voucherStatus === 'valid' && voucherData && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '8px 12px',
          borderRadius: '6px',
          marginTop: '12px',
          fontSize: '13px',
          textAlign: 'center',
          border: '1px solid #c3e6cb',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '13px' }}>
            ✅ {voucherData.title}
          </div>
          <div style={{ marginBottom: '3px', fontSize: '12px' }}>
            {voucherData.discount_type === 'percentage' 
              ? `${voucherData.discount_value}% off` 
              : `£${voucherData.discount_value} off`
            }
            {voucherData.max_discount && voucherData.discount_type === 'percentage' && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                {' '}(Max: £{voucherData.max_discount})
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
            Final Price: £{voucherData.final_amount}
          </div>
          <div style={{ fontSize: '10px', marginTop: '3px', color: '#666' }}>
            Valid until: {new Date(voucherData.valid_until).toLocaleDateString()}
          </div>
        </div>
      )}

      {voucherStatus === 'invalid' && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '8px 12px',
          borderRadius: '6px',
          marginTop: '12px',
          fontSize: '13px',
          textAlign: 'center',
          border: '1px solid #f5c6cb',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word'
        }}>
          ❌ Invalid voucher code
          <div style={{ 
            fontSize: '11px', 
            marginTop: '3px', 
            color: '#721c24',
            lineHeight: '1.3'
          }}>
            Please check the code and try again
          </div>
        </div>
      )}
    </div>
  );
};

export default RedeemVoucherCard; 