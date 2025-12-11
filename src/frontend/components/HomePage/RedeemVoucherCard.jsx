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

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="voucher-card-container" style={{ 
      width: '100%', 
      maxWidth: '100%',
      height: isMobile ? '120px' : '220px',
      minHeight: isMobile ? '120px' : '220px',
      maxHeight: isMobile ? '120px' : '220px',
      overflow: isMobile ? 'hidden' : 'auto',
      overflowY: isMobile ? 'hidden' : 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRadius: '20px',
      border: '2px solid #03a9f4',
      margin: 0,
      position: 'relative'
    }}>
      <div className="voucher-label" style={{ 
        color: "#0d47a1", 
        fontSize: isMobile ? "11px" : "16px", 
        fontWeight: "500", 
        marginBottom: isMobile ? "2px" : "8px", 
        marginTop: isMobile ? "2px" : "0",
        textAlign: "center", 
        width: '100%',
        lineHeight: '1.1',
        flexShrink: 0,
        maxHeight: isMobile ? '14px' : 'auto',
        overflow: 'hidden'
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
          margin: isMobile ? '2px auto 4px auto' : '8px auto 12px auto', 
          display: 'block',
          padding: isMobile ? '3px 6px' : '8px 12px',
          fontSize: isMobile ? '11px' : '14px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxSizing: 'border-box',
          flexShrink: 0,
          maxHeight: isMobile ? '24px' : 'auto',
          height: isMobile ? '24px' : 'auto'
        }}
        onClick={e => e.stopPropagation()}
        onFocus={e => e.stopPropagation()}
        placeholder="Enter voucher code..."
      />
      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: "rgb(0, 235, 91)",
          color: "white", 
          border: "none",
          borderRadius: "4px",
          padding: isMobile ? '3px 10px' : "8px 16px",
          fontSize: isMobile ? "11px" : "14px",
          fontWeight: "500",
          cursor: "pointer",
          lineHeight: "1.2",
          marginBottom: isMobile ? "2px" : "8px",
          minWidth: "60px",
          flexShrink: 0,
          maxHeight: isMobile ? '24px' : 'auto',
          height: isMobile ? '24px' : 'auto'
        }}
      >
        Redeem
      </button>

      {/* Voucher Status Display */}
      {voucherStatus === 'valid' && voucherData && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: isMobile ? '2px 4px' : '6px 10px',
          borderRadius: '4px',
          marginTop: isMobile ? '2px' : '4px',
          fontSize: isMobile ? '8px' : '12px',
          textAlign: 'center',
          border: '1px solid #c3e6cb',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          flexShrink: 0,
          maxHeight: isMobile ? '32px' : 'auto',
          overflow: isMobile ? 'hidden' : 'visible',
          lineHeight: isMobile ? '1.1' : '1.3'
        }}>
          <div style={{ fontWeight: '600', marginBottom: isMobile ? '1px' : '4px', fontSize: isMobile ? '9px' : '13px', lineHeight: '1.1' }}>
            ✅ {isMobile ? voucherData.title.substring(0, 20) + (voucherData.title.length > 20 ? '...' : '') : voucherData.title}
          </div>
          <div style={{ marginBottom: isMobile ? '1px' : '3px', fontSize: isMobile ? '8px' : '12px', lineHeight: '1.1' }}>
            {voucherData.discount_type === 'percentage' 
              ? `${parseFloat(voucherData.discount_value || 0).toFixed(2)}% off` 
              : `£${parseFloat(voucherData.discount_value || 0).toFixed(2)} off`
            }
            {!isMobile && voucherData.max_discount && voucherData.discount_type === 'percentage' && (
              <span style={{ fontSize: '11px', color: '#666' }}>
                {' '}(Max: £{voucherData.max_discount})
              </span>
            )}
          </div>
          {!isMobile && (
            <>
              <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '500' }}>
                Final Price: £{voucherData.final_amount}
              </div>
              <div style={{ fontSize: '10px', marginTop: '3px', color: '#666' }}>
                Valid until: {voucherData.valid_until ? new Date(voucherData.valid_until).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
              </div>
            </>
          )}
        </div>
      )}

      {voucherStatus === 'invalid' && (
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: isMobile ? '2px 4px' : '6px 10px',
          borderRadius: '4px',
          marginTop: isMobile ? '2px' : '4px',
          fontSize: isMobile ? '9px' : '12px',
          textAlign: 'center',
          border: '1px solid #f5c6cb',
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          flexShrink: 0,
          maxHeight: isMobile ? '28px' : 'auto',
          overflow: isMobile ? 'hidden' : 'visible',
          lineHeight: isMobile ? '1.1' : '1.3'
        }}>
          ❌ {isMobile ? 'Invalid code' : 'Invalid voucher code'}
          {!isMobile && (
            <div style={{ 
              fontSize: '11px', 
              marginTop: '3px', 
              color: '#721c24',
              lineHeight: '1.3'
            }}>
              Please check the code and try again
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RedeemVoucherCard; 