import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import Accordion from "../Common/Accordion";
import { Tooltip as ReactTooltip }  from 'react-tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BsInfoCircle } from 'react-icons/bs';

const PassengerInfo = forwardRef(({ isGiftVoucher, isFlightVoucher, addPassenger, passengerData, setPassengerData, weatherRefund, setWeatherRefund, activeAccordion, setActiveAccordion, chooseFlightType, activitySelect, chooseLocation, selectedVoucherType, privateCharterWeatherRefund, setPrivateCharterWeatherRefund }, ref) => {
  // Parse passengerCount from chooseFlightType and ensure it's at least 1
  // For Buy Gift, always 1 passenger
  const passengerCount = activitySelect === 'Buy Gift' ? 1 : Math.max(parseInt(chooseFlightType?.passengerCount) || 0, 1);
  
  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);
  
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

  // Validation function for all activity types
  const validateFields = () => {
    const errors = [];
    passengerData.forEach((passenger, index) => {
      const passengerErrors = {};
      
      // All fields are required for Book Flight, Redeem Voucher, Flight Voucher, and Buy Gift
      if (activitySelect === 'Book Flight' || activitySelect === 'Redeem Voucher' || activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') {
        if (!passenger.firstName?.trim()) passengerErrors.firstName = true;
        if (!passenger.lastName?.trim()) passengerErrors.lastName = true;
        if (!passenger.phone?.trim()) passengerErrors.phone = true;
        if (!passenger.email?.trim()) passengerErrors.email = true;
        
        // Weight is required for Book Flight, Redeem Voucher, and Flight Voucher but not for Buy Gift
        if (activitySelect !== 'Buy Gift' && !passenger.weight?.trim()) passengerErrors.weight = true;
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
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Expose validation function to parent
  useImperativeHandle(ref, () => ({
    validate: validateFields
  }));

  // Styles for custom ticked circle
  const checkStyle = {
    position: 'relative',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: '2px solid gray',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-block',
  };
  const activeCheckStyle = {
    ...checkStyle,
    backgroundColor: '#74da78',
    borderColor: '#74da78',
  };
  const checkIconStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    pointerEvents: 'none',
  };

  return (
    <Accordion 
      title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
      id="passenger-info" 
      activeAccordion={activeAccordion} 
      setActiveAccordion={setActiveAccordion}
    >
      <div className="tab_box presger-scroll" style={{ padding: '10px 20px' }}>
        {/* Display a message if no passengers are selected */}
        {passengerCount <= 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Please select a flight type and the number of passengers first.
          </div>
        )}
        
        {/* Generate passenger forms based on passenger count */}
        {[...Array(passengerCount)].map((_, index) => {
          const passenger = passengerData[index] || { firstName: "", lastName: "", weight: "", phone: "", email: "" };
          const error = validationErrors[index] || {};
          return (
            <div className="all-pressenger" key={index} style={{ marginBottom: '20px', padding: '15px', border: index > 0 ? '1px solid #eee' : 'none', borderRadius: '8px' }}>
              <div className="presnger_one" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="presnger-tag">
                  <h3 style={{ margin: '0' }}>{activitySelect === 'Buy Gift' ? 'Purchaser Details' : `Passenger ${index + 1}`}</h3>
                </div>
                {/* Weather Refundable alanı sadece Flight Voucher seçili DEĞİLSE ve Private Charter DEĞİLSE gösterilecek */}
                {!(activitySelect === "Redeem Voucher" || activitySelect === "Buy Gift" || chooseFlightType?.type === "Private Flight" || (activitySelect === "Redeem Voucher" && chooseLocation === "Bristol Fiesta") || activitySelect === "Flight Voucher" || chooseFlightType?.type === "Private Charter") && (
                <div className="final_pax-label-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label className="passenger_weather-refund" htmlFor={`weatherRefund-${index}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", margin: '0' }}>
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
                      <p style={{ margin: 0 }}>Weather Refundable</p>
                      {passenger.weatherRefund && (
                        <span style={{
                          background: "#61D836",
                          padding: "6px 12px",
                          borderRadius: "15px",
                          color: "#fff",
                          fontFamily: 'Gilroy',
                          fontSize: "14px",
                          fontWeight: "500"
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
                
                {/* Private Charter Weather Refundable - One-time charge for entire booking */}
                {chooseFlightType?.type === "Private Charter" && (
                <div className="final_pax-label-wrap" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <label className="passenger_weather-refund" htmlFor="privateCharterWeatherRefund" style={{ cursor: "pointer", display: 'flex', alignItems: 'center', gap: '8px', margin: '0' }}>
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
                      <p style={{ margin: 0 }}>Weather Refundable (Private Charter)</p>
                      {privateCharterWeatherRefund && (
                        <span style={{
                          background: "#61D836",
                          padding: "6px 12px",
                          borderRadius: "15px",
                          color: "#fff",
                          fontFamily: 'Gilroy',
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>+£{getPrivateCharterWeatherRefundPrice()}</span>
                      )}
                      {!privateCharterWeatherRefund && (
                        <span style={{
                          background: "#f3f4f6",
                          padding: "6px 12px",
                          borderRadius: "15px",
                          color: "#6b7280",
                          fontFamily: 'Gilroy',
                          fontSize: "14px",
                          fontWeight: "500"
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
                    <label>First Name<span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                      name="firstName"
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerInputChange(index, e)}
                      required
                      style={error?.firstName ? { border: '1.5px solid red' } : {}}
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
                      style={error?.lastName ? { border: '1.5px solid red' } : {}}
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
                        type="tel"
                        required
                        style={error?.weight ? { border: '1.5px solid red' } : {}}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        name="weight"
                        value={passenger.weight}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder="Kg"
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
                        style={error?.phone ? { border: '1.5px solid red' } : {}}
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
                        style={error?.email || emailErrors[index] ? { border: '1.5px solid red' } : {}}
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
