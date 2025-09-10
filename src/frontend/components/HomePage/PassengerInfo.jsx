import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import Accordion from "../Common/Accordion";
import { Tooltip as ReactTooltip }  from 'react-tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BsInfoCircle } from 'react-icons/bs';

const PassengerInfo = forwardRef(({ isGiftVoucher, isFlightVoucher, addPassenger, passengerData, setPassengerData, weatherRefund, setWeatherRefund, activeAccordion, setActiveAccordion, chooseFlightType, activitySelect, chooseLocation, selectedVoucherType, privateCharterWeatherRefund, setPrivateCharterWeatherRefund, onSectionCompletion }, ref) => {
  // Determine passengerCount
  // - For Buy Gift: fixed to 1
  // - For Flight Voucher and Book Flight: prefer quantity from selected voucher type
  // - Otherwise: fall back to chooseFlightType.passengerCount (min 1)
  const passengerCount = (() => {
    if (activitySelect === 'Buy Gift') {
      return 1;
    }
    const isVoucherDriven = chooseFlightType?.type === 'Flight Voucher' || activitySelect === 'Book Flight';
    if (isVoucherDriven) {
      // Prefer explicit quantity prop
      if (selectedVoucherType?.quantity !== undefined && selectedVoucherType?.quantity !== null) {
        const extracted = typeof selectedVoucherType.quantity === 'string'
          ? (selectedVoucherType.quantity.match(/\d+/)?.[0] ?? selectedVoucherType.quantity)
          : selectedVoucherType.quantity;
        const q = Math.max(parseInt(extracted, 10) || 1, 1);
        if (q) return q;
      }
      // Fallback: extract from title like "Any Day Flight (3 passengers)"
      if (typeof selectedVoucherType?.title === 'string') {
        const m = selectedVoucherType.title.match(/\((\d+)\s*passenger/i);
        if (m && m[1]) {
          return Math.max(parseInt(m[1], 10) || 1, 1);
        }
      }
    }
    return Math.max(parseInt(chooseFlightType?.passengerCount) || 0, 1);
  })();
  
  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  // Add console logs to debug
  console.log("chooseFlightType in PassengerInfo:", chooseFlightType);
  console.log("Passenger count:", passengerCount);
  console.log("Current passengerData length:", passengerData.length);
  console.log("selectedVoucherType in PassengerInfo:", selectedVoucherType);
  console.log("Should show Private Charter weather refundable:", chooseFlightType?.type === "Private Charter");
  console.log("Activity select:", activitySelect);
  console.log("Array length for mapping:", [...Array(passengerCount)].length);
  console.log("Flight type check:", chooseFlightType?.type);
  console.log("Is Private Charter:", chooseFlightType?.type === "Private Charter");

  // Sync passengerData with passenger count whenever chooseFlightType changes
  useEffect(() => {
    console.log("Updating passenger data, count:", passengerCount);
    
    setPassengerData((prevData) => {
      // Create a new array with the correct number of passenger objects
      const newPassengers = [...prevData];

      // Add passenger objects if needed
      for (let i = prevData.length; i < passengerCount; i++) {
        newPassengers.push({ firstName: "", lastName: "", weight: "", phone: "", email: "", weatherRefund: false });
      }

      // Trim the array to match the selected passenger count
      return newPassengers.slice(0, passengerCount);
    });
  }, [passengerCount, setPassengerData, chooseFlightType]);

  const [emailErrors, setEmailErrors] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  // Handle passenger input change
  const handlePassengerInputChange = (index, e) => {
    const { name, value } = e.target;
    setPassengerData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index] = { ...updatedData[index], [name]: value };
      return updatedData;
    });
    
    // Clear validation error when user starts typing
    if (validationErrors[index] && validationErrors[index][name]) {
      setValidationErrors(prev => {
        const newErrors = [...prev];
        if (newErrors[index]) {
          newErrors[index] = { ...newErrors[index], [name]: false };
        }
        return newErrors;
      });
    }
    
    // Email validation
    if (name === 'email') {
      const newErrors = [...emailErrors];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      newErrors[index] = value && !emailRegex.test(value);
      setEmailErrors(newErrors);
    }
  };

  // Handle weather refund toggle for regular passengers
  const handleWeatherRefundChange = (index) => {
    setPassengerData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index] = { ...updatedData[index], weatherRefund: !updatedData[index].weatherRefund };
      return updatedData;
    });
  };

  // Handle weather refund toggle for Private Charter (one-time charge)
  const handlePrivateCharterWeatherRefundChange = () => {
    setPrivateCharterWeatherRefund(!privateCharterWeatherRefund);
  };

  // Calculate weather refundable price for Private Charter (10% of voucher type price)
  const getPrivateCharterWeatherRefundPrice = () => {
    console.log("getPrivateCharterWeatherRefundPrice called with:", selectedVoucherType);
    
    // If we have selectedVoucherType with price, use it
    if (selectedVoucherType && selectedVoucherType.price) {
      const price = (selectedVoucherType.price * 0.1).toFixed(2);
      console.log(`Private Charter weather refundable price calculated: ${selectedVoucherType.price} * 0.1 = £${price}`);
      return price;
    }
    
    // Fallback: If no voucher type but we know it's Private Charter, use a default calculation
    // This assumes the voucher price is around £150-300 based on the Group Pricing
    const fallbackPrice = 150; // Default to £150 as fallback
    const price = (fallbackPrice * 0.1).toFixed(2);
    console.log(`Using fallback price calculation: ${fallbackPrice} * 0.1 = £${price}`);
    return price;
  };

  // Optional validation function for Buy Gift, strict for others
  // When setErrors=false, perform a silent validation (no red borders yet)
  const validateFields = (setErrors = true) => {
    const errors = [];
    
    console.log('👥 Starting passenger validation for:', activitySelect);
    console.log('👥 Passenger data:', passengerData);
    
    passengerData.forEach((passenger, index) => {
      const passengerErrors = {};
      
      console.log(`👤 Validating passenger ${index + 1}:`, passenger);
      
      if (activitySelect === 'Buy Gift') {
        // For Buy Gift: All fields are required again (only first passenger needs phone/email)
        console.log(`🎁 Buy Gift validation - all fields required for passenger ${index + 1}`);
        
        // First Name validation
        if (!passenger.firstName?.trim()) {
          passengerErrors.firstName = true;
          console.log(`❌ Passenger ${index + 1} firstName failed:`, passenger.firstName);
        }
        
        // Last Name validation
        if (!passenger.lastName?.trim()) {
          passengerErrors.lastName = true;
          console.log(`❌ Passenger ${index + 1} lastName failed:`, passenger.lastName);
        }
        
        // Phone and Email validation (only for first passenger - purchaser)
        if (index === 0) {
          // Phone validation for first passenger
          if (!passenger.phone?.trim()) {
            passengerErrors.phone = true;
            console.log(`❌ First passenger phone failed:`, passenger.phone);
          }
          
          // Email validation for first passenger (format + required)
          if (!passenger.email?.trim()) {
            passengerErrors.email = true;
            console.log(`❌ First passenger email failed (empty):`, passenger.email);
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(passenger.email.trim())) {
              passengerErrors.email = true;
              console.log(`❌ First passenger email failed (format):`, passenger.email);
            }
          }
        }
        
      } else if (activitySelect === 'Book Flight' || activitySelect === 'Redeem Voucher' || activitySelect === 'Flight Voucher') {
        // For other activity types: All fields required
        
        // First Name validation
        if (!passenger.firstName?.trim()) {
          passengerErrors.firstName = true;
          console.log(`❌ Passenger ${index + 1} firstName failed:`, passenger.firstName);
        }
        
        // Last Name validation
        if (!passenger.lastName?.trim()) {
          passengerErrors.lastName = true;
          console.log(`❌ Passenger ${index + 1} lastName failed:`, passenger.lastName);
        }
        
        // Phone and Email validation only for the first passenger (contact person)
        if (index === 0) {
          if (!passenger.phone?.trim()) {
            passengerErrors.phone = true;
            console.log(`❌ First passenger phone failed:`, passenger.phone);
          }
          if (!passenger.email?.trim()) {
            passengerErrors.email = true;
            console.log(`❌ First passenger email failed (empty):`, passenger.email);
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(passenger.email.trim())) {
              passengerErrors.email = true;
              console.log(`❌ First passenger email failed (format):`, passenger.email);
            }
          }
        }
        
        // Weight is required for Book Flight, Redeem Voucher, and Flight Voucher
        if (!passenger.weight?.trim()) {
          passengerErrors.weight = true;
          console.log(`❌ Passenger ${index + 1} weight failed:`, passenger.weight);
        }
      } else {
        // For other activity types, basic validation
        if (!passenger.firstName?.trim()) passengerErrors.firstName = true;
        if (!passenger.lastName?.trim()) passengerErrors.lastName = true;
        if (!passenger.phone?.trim()) passengerErrors.phone = true;
        if (!passenger.email?.trim()) passengerErrors.email = true;
        
        // Weight is required for Flight Voucher but not for Buy Gift
        if (isFlightVoucher && !passenger.weight?.trim()) passengerErrors.weight = true;
      }
      
      if (Object.keys(passengerErrors).length > 0) {
        errors[index] = passengerErrors;
        console.log(`❌ Passenger ${index + 1} has errors:`, passengerErrors);
      } else {
        console.log(`✅ Passenger ${index + 1} validation passed`);
      }
    });
    
    const isValid = errors.length === 0;
    console.log('👥 Final passenger validation result:', {
      activitySelect,
      passengerCount: passengerData.length,
      errors,
      isValid,
      note: activitySelect === 'Buy Gift' ? 'All fields optional for Buy Gift' : 'Standard validation applied'
    });
    
    if (setErrors) {
      setValidationErrors(errors);
    }
    return isValid;
  };

  // Expose validation function to parent
  useImperativeHandle(ref, () => ({
    validate: validateFields
  }));

  // Auto-trigger section completion when all fields are valid (fire once per validity session)
  const completionFiredRef = useRef(false);
  useEffect(() => {
    if (!onSectionCompletion || passengerData.length === 0) return;
    // Run silent validation here to avoid showing red borders on first open
    const isValid = validateFields(false);
    if (isValid && !completionFiredRef.current) {
      completionFiredRef.current = true;
      console.log('✅ All passenger fields valid, triggering section completion');
      onSectionCompletion('passenger-info');
    }
    if (!isValid) {
      completionFiredRef.current = false;
    }
  }, [passengerData, onSectionCompletion]);

  // Styles for custom ticked circle
  const checkStyle = {
    position: 'relative',
    width: isMobile ? '24px' : '20px',
    height: isMobile ? '24px' : '20px',
    borderRadius: '50%',
    border: isMobile ? '3px solid #d1d5db' : '2px solid gray',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    boxShadow: isMobile ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none',
  };
  const activeCheckStyle = {
    ...checkStyle,
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    boxShadow: isMobile ? '0 4px 8px rgba(59, 130, 246, 0.3)' : 'none',
  };
  const checkIconStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    fontSize: isMobile ? '14px' : '12px',
    fontWeight: 'bold',
    pointerEvents: 'none',
  };

  const isMultiPassenger = passengerCount > 1;

  return (
    <Accordion 
      title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
      id="passenger-info" 
      activeAccordion={activeAccordion} 
      setActiveAccordion={setActiveAccordion}
    >
      <div className="tab_box presger-scroll" style={{ 
        padding: isMobile ? '12px 16px' : '10px 20px',
        overflowX: isMobile ? 'hidden' : (isMultiPassenger ? 'hidden' : 'auto'),
        overflowY: isMobile ? 'auto' : 'auto'
      }} ref={scrollContainerRef}>
        {/* Display a message if no passengers are selected */}
        {passengerCount <= 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Please select a flight type and the number of passengers first.
          </div>
        )}
        
        {/* When multiple passengers, show quick navigator chips */}
        {passengerCount > 1 && null}

        {/* Generate passenger forms based on passenger count */}
        {console.log("Rendering passengers, count:", passengerCount, "array:", [...Array(passengerCount)])}
        {[...Array(passengerCount)].map((_, index) => {
          const passenger = passengerData[index] || { firstName: "", lastName: "", weight: "", phone: "", email: "" };
          const error = validationErrors[index] || {};
          console.log(`Rendering passenger ${index + 1}, data:`, passenger);
          return (
            <div id={`passenger-${index+1}`} className="all-pressenger" key={index} style={{ 
              marginBottom: isMobile ? '20px' : '20px', 
              padding: isMobile ? '20px' : '15px', 
              border: isMobile ? (index > 0 ? '2px solid #d1d5db' : '1px solid #e5e7eb') : (index > 0 ? '1px solid #eee' : 'none'), 
              borderRadius: isMobile ? '20px' : '8px', 
              background: isMobile ? (index > 0 ? '#f8fafc' : '#ffffff') : (index > 0 ? '#fcfcfd' : 'transparent'),
              boxShadow: isMobile ? (index > 0 ? '0 6px 12px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)') : 'none',
              width: isMobile ? '100%' : (isMultiPassenger ? '100%' : 'auto'),
              minWidth: isMobile ? '100%' : (isMultiPassenger ? '100%' : 'auto'),
              flexShrink: isMobile ? 0 : (isMultiPassenger ? 0 : 1),
              position: 'relative',
              zIndex: 1,
              borderTop: isMobile && index > 0 ? '4px solid #3b82f6' : 'none'
            }}>
              <div className="presnger_one" style={{ 
                marginBottom: index === 0 ? '8px' : '6px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '0'
              }}>
                <div className="presnger-tag">
                  <h3 style={{ 
                    margin: '0', 
                    lineHeight: 1,
                    fontSize: isMobile ? '20px' : '16px',
                    fontWeight: isMobile ? '700' : '500',
                    color: isMobile ? '#1f2937' : 'inherit',
                    textAlign: isMobile ? 'center' : 'left',
                    width: isMobile ? '100%' : 'auto'
                  }}>{activitySelect === 'Buy Gift' ? 'Your Details – The Purchaser' : `Passenger ${index + 1}`}</h3>
                </div>
                {/* Weather Refundable: Hide for Buy Gift + Any Day Flight (purchaser info) */}
                {selectedVoucherType?.title === "Any Day Flight" && activitySelect !== 'Buy Gift' && (
                <div className="final_pax-label-wrap" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'center' : 'flex-end'
                }}>
                  <label className="passenger_weather-refund" htmlFor={`weatherRefund-${index}`} style={{ 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: isMobile ? "12px" : "8px", 
                    margin: '0',
                    padding: isMobile ? '8px 12px' : '0',
                    borderRadius: isMobile ? '8px' : '0',
                    backgroundColor: isMobile ? '#f8fafc' : 'transparent',
                    border: isMobile ? '1px solid #e2e8f0' : 'none',
                    transition: isMobile ? 'all 0.2s ease' : 'none'
                  }}>
                    <span
                      style={passenger.weatherRefund ? activeCheckStyle : checkStyle}
                      onClick={() => handleWeatherRefundChange(index)}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={passenger.weatherRefund}
                    >
                      {passenger.weatherRefund && (
                        <span style={checkIconStyle}>✓</span>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: isMobile ? '16px' : '14px',
                        fontWeight: isMobile ? '500' : '400',
                        color: isMobile ? '#374151' : 'inherit'
                      }}>Weather Refundable</p>
                      {passenger.weatherRefund && (
                        <span style={{
                          background: "#61D836",
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          borderRadius: isMobile ? "12px" : "15px",
                          color: "#fff",
                          fontFamily: 'Gilroy',
                          fontSize: isMobile ? "11px" : "14px",
                          fontWeight: isMobile ? "600" : "500",
                          minWidth: isMobile ? "60px" : "auto",
                          textAlign: "center",
                          display: "inline-block"
                        }}>+£47.50</span>
                      )}
                      <div className="info-icon-container" style={{ position: 'relative' }}>
                        <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                        <div className="hover-text">
                          <p>Recommended for overseas travellers. Without the weather refundable option your voucher is non-refundable under any circumstances. However, re-bookable as needed for up to 24 months.</p>
                        </div>
                      </div>
                    </span>
                  </label>
                </div>
                )}
                
                {/* Private Charter Weather Refundable - One-time charge for entire booking, only for Any Day Flight */}
                {chooseFlightType?.type === "Private Charter" && selectedVoucherType?.title === "Any Day Flight" && (
                <div className="final_pax-label-wrap" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginTop: '10px',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'center' : 'flex-end'
                }}>
                  <label className="passenger_weather-refund" htmlFor="privateCharterWeatherRefund" style={{ 
                    cursor: "pointer", 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? "12px" : "8px", 
                    margin: '0',
                    padding: isMobile ? '8px 12px' : '0',
                    borderRadius: isMobile ? '8px' : '0',
                    backgroundColor: isMobile ? '#f8fafc' : 'transparent',
                    border: isMobile ? '1px solid #e2e8f0' : 'none',
                    transition: isMobile ? 'all 0.2s ease' : 'none'
                  }}>
                    <span
                      style={privateCharterWeatherRefund ? activeCheckStyle : checkStyle}
                      onClick={handlePrivateCharterWeatherRefundChange}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={privateCharterWeatherRefund}
                    >
                      {privateCharterWeatherRefund && (
                        <span style={checkIconStyle}>✓</span>
                      )}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: isMobile ? '16px' : '14px',
                        fontWeight: isMobile ? '500' : '400',
                        color: isMobile ? '#374151' : 'inherit'
                      }}>Weather Refundable (Private Charter)</p>
                      {privateCharterWeatherRefund && (
                        <span style={{
                          background: "#61D836",
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          borderRadius: isMobile ? "12px" : "15px",
                          color: "#fff",
                          fontFamily: 'Gilroy',
                          fontSize: isMobile ? "11px" : "14px",
                          fontWeight: isMobile ? "600" : "500",
                          minWidth: isMobile ? "60px" : "auto",
                          textAlign: "center",
                          display: "inline-block"
                        }}>+£{getPrivateCharterWeatherRefundPrice()}</span>
                      )}
                      {!privateCharterWeatherRefund && (
                        <span style={{
                          background: "#f3f4f6",
                          padding: isMobile ? "4px 8px" : "6px 12px",
                          borderRadius: isMobile ? "12px" : "15px",
                          color: "#6b7280",
                          fontFamily: 'Gilroy',
                          fontSize: isMobile ? "11px" : "14px",
                          fontWeight: isMobile ? "600" : "500",
                          minWidth: isMobile ? "60px" : "auto",
                          textAlign: "center",
                          display: "inline-block"
                        }}>+£{getPrivateCharterWeatherRefundPrice()}</span>
                      )}
                      <div className="info-icon-container" style={{ position: 'relative' }}>
                        <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                        <div className="hover-text">
                          <p>Private Charter Weather Refundable: One-time charge for the entire booking (10% of voucher type price). Recommended for overseas travellers. Without this option your voucher is non-refundable under any circumstances.</p>
                        </div>
                      </div>
                    </span>
                  </label>
                </div>
                )}
              </div>
              <div className="form-presnger" style={{ gap: '15px', display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
                  <div style={{ flex: 1, width: '100%' }}>
                    <label style={{
                      fontSize: isMobile ? '14px' : '12px',
                      fontWeight: isMobile ? '600' : '500',
                      color: isMobile ? '#374151' : 'inherit',
                      marginBottom: isMobile ? '6px' : '4px',
                      display: 'block'
                    }}>First Name<span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                      name="firstName"
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerInputChange(index, e)}
                      required
                      style={{
                        ...(error?.firstName ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? {
                          fontSize: '16px',
                          padding: '12px 16px',
                          minHeight: '48px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        } : {})
                      }}
                      placeholder="First Name"
                    />
                    {error?.firstName && <span style={{ color: 'red', fontSize: 12 }}>First name is required</span>}
                  </div>
                  <div style={{ flex: 1, width: '100%' }}>
                    <label>Last Name<span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                      name="lastName"
                      value={passenger.lastName}
                      onChange={(e) => handlePassengerInputChange(index, e)}
                      required
                      style={{
                        ...(error?.lastName ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? {
                          fontSize: '16px',
                          padding: '12px 16px',
                          minHeight: '48px',
                          border: '2px solid #d1d5db',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          fontWeight: '500',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease'
                        } : {})
                      }}
                      placeholder="Last Name"
                    />
                    {error?.lastName && <span style={{ color: 'red', fontSize: 12 }}>Last name is required</span>}
                  </div>
                  {/* Weight input sadece Buy Gift seçili DEĞİLSE gösterilecek */}
                  {activitySelect !== 'Buy Gift' && (
                    <div style={{ flex: 1, width: '100%' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: isMobile ? '0' : '-10px' }}>
                        Weight (Kg)<span style={{ color: 'red' }}>*</span>
                        <span className="weight-info-wrapper" style={{ display: 'inline-flex', position: 'relative', zIndex: 10 }}>
                          <div className="info-icon-container" style={{ position: 'relative' }}>
                            <BsInfoCircle size={14} style={{ width: 14, height: 14 }} />
                            <div className="hover-text">
                              <p>Approximate weights are fine but please be as accurate as you can. If unsure, mark as TBC and contact us before your flight. There is a maximum weight limit of 18 Stone/114Kg on Shared Flights.</p>
                            </div>
                          </div>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        style={{
                          ...(error?.weight ? { border: '1.5px solid red' } : {}),
                          ...(isMobile ? {
                            fontSize: '16px',
                            padding: '12px 16px',
                            minHeight: '48px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontWeight: '500',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease'
                          } : {})
                        }}
                        name="weight"
                        value={passenger.weight}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder="Max 18 Stone / 114Kg"
                      />
                      {error?.weight && <span style={{ color: 'red', fontSize: 12 }}>Weight is required</span>}
                    </div>
                  )}
                </div>
                {/* Mobile Number ve Email sadece ilk yolcu için, üstteki satırın ALTINDA yan yana gösterilecek */}
                {index === 0 && (
                  <div style={{ width: '100%', display: 'flex', gap: isMobile ? '10px' : '15px', marginTop: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <div style={{ flex: 1, width: '100%' }}>
                      <label>Mobile Number<span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        name="phone"
                        value={passenger.phone || ''}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder="Mobile Number"
                        required
                        style={{
                          ...(error?.phone ? { border: '1.5px solid red' } : {}),
                          ...(isMobile ? {
                            fontSize: '16px',
                            padding: '12px 16px',
                            minHeight: '48px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontWeight: '500',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease'
                          } : {})
                        }}
                      />
                      {error?.phone && <span style={{ color: 'red', fontSize: 12 }}>Mobile number is required</span>}
                    </div>
                    <div style={{ flex: 1, width: '100%' }}>
                      <label>Email<span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={passenger.email || ''}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder="Email"
                        required
                        style={{
                          ...(error?.email || emailErrors[index] ? { border: '1.5px solid red' } : {}),
                          ...(isMobile ? {
                            fontSize: '16px',
                            padding: '12px 16px',
                            minHeight: '48px',
                            border: '2px solid #d1d5db',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                            color: '#374151',
                            fontWeight: '500',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            transition: 'all 0.2s ease'
                          } : {})
                        }}
                      />
                      {error?.email && <span style={{ color: 'red', fontSize: 12 }}>Email is required</span>}
                      {emailErrors[index] && <span style={{ color: 'red', fontSize: 12 }}>Invalid email format</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Accordion>
  );
});

export function validatePassengers(passengerData) {
  return passengerData.map((p) => {
    return {
      firstName: !p.firstName,
      lastName: !p.lastName,
      weight: !p.weight,
      phone: !p.phone,
      email: !p.email,
    };
  });
}

export default PassengerInfo;
