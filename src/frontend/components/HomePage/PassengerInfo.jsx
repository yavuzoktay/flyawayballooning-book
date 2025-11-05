import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from "react";
import Accordion from "../Common/Accordion";
import { Tooltip as ReactTooltip }  from 'react-tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BsInfoCircle } from 'react-icons/bs';

const PassengerInfo = forwardRef(({ isGiftVoucher, isFlightVoucher, addPassenger, passengerData, setPassengerData, weatherRefund, setWeatherRefund, activeAccordion, setActiveAccordion, chooseFlightType, activitySelect, chooseLocation, selectedVoucherType, privateCharterWeatherRefund, setPrivateCharterWeatherRefund, onSectionCompletion, isDisabled = false }, ref) => {
  // Determine passengerCount
  // - For Buy Gift: fixed to 1
  // - For Flight Voucher and Book Flight: prefer quantity from selected voucher type
  // - Otherwise: fall back to chooseFlightType.passengerCount (min 1)
  const passengerCount = (() => {
    if (activitySelect === 'Buy Gift') {
      return 1;
    }
    // If Redeem Voucher and selectedVoucherType.quantity is numeric, use it (populated from backend count)
    if (activitySelect === 'Redeem Voucher') {
      const q = parseInt(selectedVoucherType?.quantity ?? chooseFlightType?.passengerCount, 10);
      if (!Number.isNaN(q) && q > 0) return q;
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
  // Mobile carousel disabled: stack passengers vertically on mobile
  const enableMobileCarousel = false;
  
  // Mobile carousel state for multiple passengers
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile carousel navigation functions
  const handlePrevPassenger = () => {
    if (currentPassengerIndex > 0) {
      const newIndex = currentPassengerIndex - 1;
      setCurrentPassengerIndex(newIndex);
      setCanScrollLeft(newIndex > 0);
      setCanScrollRight(newIndex < passengerCount - 1);
      
      // Scroll to the passenger
      const container = document.querySelector('.passenger-cards-container');
      if (container) {
        const gap = 16;
        const itemWidth = container.clientWidth - 8 + gap;
        const targetScrollLeft = newIndex * itemWidth;
        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleNextPassenger = () => {
    if (currentPassengerIndex < passengerCount - 1) {
      const newIndex = currentPassengerIndex + 1;
      setCurrentPassengerIndex(newIndex);
      setCanScrollLeft(newIndex > 0);
      setCanScrollRight(newIndex < passengerCount - 1);
      
      // Scroll to the passenger
      const container = document.querySelector('.passenger-cards-container');
      if (container) {
        const gap = 16;
        const itemWidth = container.clientWidth - 8 + gap;
        const targetScrollLeft = newIndex * itemWidth;
        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    }
  };

  // Function to check if previous passengers are complete
  const isPreviousPassengerComplete = (currentIndex) => {
    if (currentIndex === 0) return true; // First passenger is always enabled
    
    for (let i = 0; i < currentIndex; i++) {
      const passenger = passengerData[i];
      if (!passenger) return false;
      
      // Check required fields
      const requiredFields = ['firstName', 'lastName', 'weight'];
      
      // For Passenger 1 or Buy Gift, also check phone and email
      if (i === 0 || activitySelect === 'Buy Gift') {
        requiredFields.push('phone', 'email');
      }
      
      for (const field of requiredFields) {
        if (!passenger[field] || passenger[field].trim() === '') {
          return false;
        }
      }
    }
    
    return true;
  };

  // Function to check if current passenger is complete
  const isCurrentPassengerComplete = (index) => {
    const passenger = passengerData[index];
    if (!passenger) return false;
    
    const requiredFields = ['firstName', 'lastName', 'weight'];
    
    // For Passenger 1 or Buy Gift, also check phone and email
    if (index === 0 || activitySelect === 'Buy Gift') {
      requiredFields.push('phone', 'email');
    }
    
    for (const field of requiredFields) {
      if (!passenger[field] || passenger[field].trim() === '') {
        return false;
      }
    }
    
    return true;
  };

  // Update navigation buttons when passenger count changes
  useEffect(() => {
    if (enableMobileCarousel && isMobile && passengerCount > 1) {
      setCanScrollLeft(currentPassengerIndex > 0);
      setCanScrollRight(currentPassengerIndex < passengerCount - 1);
    }
  }, [passengerCount, currentPassengerIndex, isMobile]);

  // Track scroll position for mobile carousel
  useEffect(() => {
    if (!enableMobileCarousel || !isMobile || passengerCount <= 1) return;

    const container = document.querySelector('.passenger-cards-container');
    if (!container) return;

    let debounceTimer = null;

    const computeAndSet = () => {
      const { scrollLeft, clientWidth } = container;
      const gap = 16;
      const itemWidth = clientWidth - 8 + gap;
      
      const newCurrentIndex = Math.round(scrollLeft / itemWidth);
      const clampedIndex = Math.max(0, Math.min(newCurrentIndex, passengerCount - 1));
      setCurrentPassengerIndex(clampedIndex);
      setCanScrollLeft(clampedIndex > 0);
      setCanScrollRight(clampedIndex < passengerCount - 1);
    };

    const updateScrollButtons = () => {
      computeAndSet();
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => computeAndSet(), 120);
    };

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    container.addEventListener('touchstart', updateScrollButtons, { passive: true });
    container.addEventListener('touchmove', updateScrollButtons, { passive: true });
    container.addEventListener('touchend', updateScrollButtons, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      container.removeEventListener('touchstart', updateScrollButtons);
      container.removeEventListener('touchmove', updateScrollButtons);
      container.removeEventListener('touchend', updateScrollButtons);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [enableMobileCarousel, isMobile, passengerCount]);
  
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

  // Check if a passenger's details are complete
  // Update: Require all visible passenger inputs for every passenger card
  const isPassengerComplete = (passenger, index) => {
    const hasFirstName = !!(passenger.firstName && passenger.firstName.trim());
    const hasLastName = !!(passenger.lastName && passenger.lastName.trim());
    const needsWeight = activitySelect !== 'Buy Gift';
    const hasWeight = needsWeight ? !!(passenger.weight || passenger.weight === 0 || (typeof passenger.weight === 'string' && passenger.weight.trim() !== '')) : true;
    const hasPhone = index === 0 ? !!(passenger.phone && passenger.phone.trim()) : true;
    // Require a valid email address for Passenger 1 (must include domain after '@')
    const hasValidEmail = (() => {
      if (index !== 0) return true;
      const email = passenger.email ? passenger.email.trim() : '';
      if (!email) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // basic but robust enough for UX
      return emailRegex.test(email);
    })();
    return hasFirstName && hasLastName && hasWeight && hasPhone && hasValidEmail;
  };

  // Auto-slide to next passenger when current one is complete
  const checkAndAutoSlide = (index) => {
    if (!enableMobileCarousel || !isMobile || passengerCount <= 1) return;
    
    const passenger = passengerData[index];
    if (passenger && isPassengerComplete(passenger, index)) {
      // Add a subtle completion indicator
      const passengerCard = document.querySelector(`#passenger-${index + 1}`);
      if (passengerCard) {
        passengerCard.style.borderColor = '#10b981';
      }
      
      // 4-second delay before auto-sliding to next passenger (mobile only)
      setTimeout(() => {
        if (index < passengerCount - 1) {
          console.log(`✅ Passenger ${index + 1} complete, auto-sliding to Passenger ${index + 2} after 4s delay`);
          handleNextPassenger();
        }
      }, 6000); // 6000ms delay for mobile UX
    }
  };

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
    
    // Check for auto-slide after input change
    setTimeout(() => {
      checkAndAutoSlide(index);
    }, 100);
  };

  // Handle weather refund toggle for regular passengers
  const handleWeatherRefundChange = (index) => {
    setPassengerData((prevData) => {
      const updatedData = [...prevData];
      updatedData[index] = { ...updatedData[index], weatherRefund: !updatedData[index].weatherRefund };
      return updatedData;
    });
    
    // Check for auto-slide after weather refund change
    setTimeout(() => {
      checkAndAutoSlide(index);
    }, 100);
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

  // Validation function - require all fields for each passenger card
  // When setErrors=false, perform a silent validation (no red borders yet)
  const validateFields = (setErrors = true) => {
    const errors = [];
    
    console.log('👥 Starting passenger validation for:', activitySelect);
    console.log('👥 Passenger data:', passengerData);
    
    passengerData.forEach((passenger, index) => {
      const passengerErrors = {};
      
      console.log(`👤 Validating passenger ${index + 1}:`, passenger);
      
      // First name and last name required for all passengers
      if (!passenger.firstName || !passenger.firstName.trim()) passengerErrors.firstName = true;
      if (!passenger.lastName || !passenger.lastName.trim()) passengerErrors.lastName = true;
      // Weight required for all passengers except Buy Gift flow
      if (activitySelect !== 'Buy Gift') {
        if (!(passenger.weight || passenger.weight === 0 || (typeof passenger.weight === 'string' && passenger.weight.trim() !== ''))) {
          passengerErrors.weight = true;
        }
      }
      // Phone and email required for first passenger
      if (index === 0) {
        if (!passenger.phone?.trim()) passengerErrors.phone = true;
        if (!passenger.email?.trim()) {
          passengerErrors.email = true;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(passenger.email.trim())) passengerErrors.email = true;
        }
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
      note: 'All passengers must have First, Last, Weight (except Buy Gift), and P1 must have Phone & Email'
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

  // Auto-trigger section completion when all passengers are valid (fire once per validity session)
  const completionFiredRef = useRef(false);
  useEffect(() => {
    if (!onSectionCompletion || passengerData.length === 0) return;
    // Run silent validation for ALL passengers
    const isValid = passengerData.every((p, idx) => isPassengerComplete(p, idx));
    if (isValid && !completionFiredRef.current) {
      completionFiredRef.current = true;
      console.log('✅ All passenger fields valid, triggering section completion');
      onSectionCompletion('passenger-info');
    }
    if (!isValid) {
      completionFiredRef.current = false;
    }
  }, [passengerData, onSectionCompletion]);

  // Check for auto-slide on passenger data changes (mobile only)
  useEffect(() => {
    if (!enableMobileCarousel || !isMobile || passengerCount <= 1) return;
    
    // Check if current passenger is complete and auto-slide
    const currentPassenger = passengerData[currentPassengerIndex];
    if (currentPassenger && isPassengerComplete(currentPassenger, currentPassengerIndex)) {
      checkAndAutoSlide(currentPassengerIndex);
    }
  }, [passengerData, currentPassengerIndex, isMobile, passengerCount, enableMobileCarousel]);

  // Styles for custom ticked circle
  const checkStyle = {
    position: 'relative',
    width: isMobile ? '24px' : '20px',
    height: isMobile ? '24px' : '20px',
    borderRadius: '50%',
    // Match Add To Booking base border
    border: '2px solid gray',
    background: '#fff',
    cursor: 'pointer',
    display: 'inline-block',
    transition: 'all 0.2s ease',
    boxShadow: 'none',
  };
  const activeCheckStyle = {
    ...checkStyle,
    // Match Add To Booking (#74da78) green filled circle with white tick on desktop and mobile
    backgroundColor: '#74da78',
    borderColor: '#74da78',
    boxShadow: 'none',
  };
  const checkIconStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    // White tick on green filled circle
    color: '#ffffff',
    fontSize: isMobile ? '14px' : '12px',
    fontWeight: 'bold',
    pointerEvents: 'none',
  };

  const isMultiPassenger = passengerCount > 1;
  // Show a transient "Next" toast after Passenger 1 is fully completed (only when multiple passengers)
  const [showNextToast, setShowNextToast] = useState(false);
  const firstPassengerCompletedRef = useRef(false);
  useEffect(() => {
    const inPassengerSection = activeAccordion === 'passenger-info';
    const multiplePassengers = isMultiPassenger;
    const firstComplete = isPassengerComplete(passengerData[0] || {}, 0);

    if (!inPassengerSection || !multiplePassengers) {
      setShowNextToast(false);
      firstPassengerCompletedRef.current = false;
      return;
    }
    if (firstComplete && !firstPassengerCompletedRef.current) {
      firstPassengerCompletedRef.current = true;
      setShowNextToast(true);
    }
    if (!firstComplete) {
      firstPassengerCompletedRef.current = false;
      setShowNextToast(false);
    }
  }, [passengerData, isMultiPassenger, activeAccordion]);

  // Auto-hide toast after 3s whenever it becomes visible
  useEffect(() => {
    if (!showNextToast) return;
    const t = setTimeout(() => setShowNextToast(false), 3000);
    return () => clearTimeout(t);
  }, [showNextToast]);
  
  // Shared input style for mobile consistency
  const mobileInputBase = {
    fontSize: '12px',
    padding: '8px 10px',
    minHeight: '36px',
    border: '1.5px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: '500',
    lineHeight: 1.2,
    boxShadow: 'none',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 0.2s ease',
    width: isMobile ? '90%' : '100%',
    maxWidth: isMobile ? '90%' : '100%',
    boxSizing: 'border-box'
  };

  return (
    <Accordion 
      title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
      id="passenger-info" 
      activeAccordion={activeAccordion} 
      setActiveAccordion={setActiveAccordion}
      isDisabled={isDisabled}
      onBeforeClose={() => {
        // Validate all passenger inputs before allowing section to close
        const ok = validateFields(true);
        return ok; // returning false prevents close and keeps errors visible
      }}
    >
      <div className="tab_box presger-scroll" style={{ 
        // Make Purchaser Information (Buy Gift) more compact without affecting other steps
        padding: activitySelect === 'Buy Gift' ? (isMobile ? '8px 12px' : '6px 16px') : (isMobile ? '12px 16px' : '10px 20px'),
        // Extra bottom padding on mobile so sticky Summary doesn't cover inputs
        paddingBottom: activitySelect === 'Buy Gift' ? (isMobile ? '6px' : '6px') : (isMobile ? '140px' : undefined),
        // Fix the section height for Purchaser Information so there isn't excessive empty space
        height: activitySelect === 'Buy Gift' ? (isMobile ? 'auto' : '300px') : undefined,
        overflowX: isMobile ? 'hidden' : (isMultiPassenger ? 'hidden' : 'auto'),
        overflowY: 'visible'
      }} ref={scrollContainerRef}>
        {showNextToast && (
          <div style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: isMobile ? '12px' : 'auto',
            bottom: isMobile ? 'auto' : '16px',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1200,
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#ffffff',
              color: '#111827',
              padding: '10px 14px',
              borderRadius: '12px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb',
              fontWeight: 700,
              letterSpacing: '0.2px',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              Next
            </div>

          </div>
        )}
        {/* Removed helper note as requested */}
        {/* Display a message if no passengers are selected */}
        {passengerCount <= 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Please select a flight type and the number of passengers first.
          </div>
        )}
        
        {/* Mobile carousel for multiple passengers */}
        {enableMobileCarousel && isMobile && passengerCount > 1 ? (
          <div style={{ position: 'relative' }}>
            {/* Navigation Arrows */}
            <div style={{ position: 'relative' }}>
              {/* Left Arrow */}
              {canScrollLeft && (
                <div style={{ 
                  position: 'absolute', 
                  left: 10, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  zIndex: 10,
                  background: 'rgb(3, 169, 244)',
                  borderRadius: '50%',
                  width: isMobile ? 36 : 56,
                  height: isMobile ? 36 : 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }} onClick={handlePrevPassenger}>
                  <span style={{ fontSize: isMobile ? '27px' : '32px', color: '#fff', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: isMobile ? '-2px' : '0px' }}>‹</span>
                </div>
              )}

              {/* Right Arrow */}
              {canScrollRight && (
                <div style={{ 
                  position: 'absolute', 
                  right: 10, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  zIndex: 10,
                  background: 'rgb(3, 169, 244)',
                  borderRadius: '50%',
                  width: isMobile ? 36 : 56,
                  height: isMobile ? 36 : 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
                  border: 'none',
                  transition: 'all 0.2s ease'
                }} onClick={handleNextPassenger}>
                  <span style={{ fontSize: isMobile ? '27px' : '32px', color: '#fff', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: isMobile ? '-2px' : '0px' }}>›</span>
                </div>
              )}

              {/* Passenger Cards Container */}
              <div className="passenger-cards-container" style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: '16px', 
                width: '100%',
                overflowX: 'auto',
                paddingBottom: '10px',
                scrollBehavior: 'smooth',
                scrollSnapType: 'x mandatory',
                scrollPadding: '0 8px',
                WebkitOverflowScrolling: 'touch'
              }}>
                {[...Array(passengerCount)].map((_, index) => {
          const passenger = passengerData[index] || { firstName: "", lastName: "", weight: "", phone: "", email: "" };
          const error = validationErrors[index] || {};
          console.log(`Rendering passenger ${index + 1}, data:`, passenger);
          return (
            <div id={`passenger-${index+1}`} className="all-pressenger" key={index} style={{ 
              marginBottom: 0, 
              padding: activitySelect === 'Buy Gift' ? '16px' : '5px', 
              width: 'calc(100% - 32px)',
              minWidth: 'calc(100% - 32px)',
              maxWidth: 'calc(100% - 32px)',
              flexShrink: 0,
              position: 'relative',
              zIndex: 1,
              scrollSnapAlign: 'start'
            }}>
              <div className="presnger_one" style={{ 
                marginBottom: '16px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '12px' : '8px',
                flexWrap: 'nowrap',
                width: '100%',
                minWidth: '100%'
              }}>
                <div className="presnger-tag" style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: 'fit-content', width: isMobile ? '100%' : 'auto' }}>
                  <h3 style={{ 
                    margin: '0', 
                    lineHeight: 1.2,
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#1f2937',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {activitySelect === 'Buy Gift' ? 'Your Details – The Purchaser' : `Passenger ${index + 1}`}
                    {index === 0 && (activitySelect === 'Book Flight' || activitySelect === 'Flight Voucher') && (
                      <>
                        <BsInfoCircle 
                          data-tooltip-id={`passenger-info-tooltip-mobile-${index}`}
                          style={{ 
                            color: '#3b82f6', 
                            fontSize: '12px', 
                            cursor: 'pointer',
                            flexShrink: 0
                          }} 
                        />
                        <ReactTooltip
                          id={`passenger-info-tooltip-mobile-${index}`}
                          place="top"
                          content="Your booking confirmation and flight updates will be sent to the contact details provided for Passenger 1."
                          style={{
                            maxWidth: '280px',
                            fontSize: '13px',
                            textAlign: 'center',
                            backgroundColor: '#1f2937',
                            color: '#ffffff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            zIndex: 9999
                          }}
                        />
                      </>
                    )}
                  </h3>
                </div>
                {/* Weather Refundable moved to Voucher Type section */}
                
                {/* Private Charter Weather Refundable moved to Voucher Type section */}
              </div>
              <div className="form-presnger" style={{ 
                gap: activitySelect === 'Buy Gift' ? '8px' : '15px', 
                display: 'flex', 
                flexWrap: 'nowrap', 
                flexDirection: isMobile ? 'column' : 'row',
                width: '100%',
                overflowX: 'auto'
              }}>
                {/* Single row layout for all fields */}
                <div style={{ 
                  display: 'flex', 
                  gap: isMobile ? '8px' : '12px', 
                  width: '100%', 
                  flexDirection: isMobile ? 'column' : 'row',
                  flexWrap: 'nowrap',
                  minWidth: isMobile ? '0' : 'max-content',
                  maxWidth: '100%',
                  overflow: 'hidden'
                }}>
                  {/* First Name */}
                  <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : '140px', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                    <label style={{
                      fontSize: isMobile ? '12px' : '11px',
                      fontWeight: isMobile ? '500' : '500',
                      color: isMobile ? '#374151' : 'inherit',
                      marginBottom: isMobile ? '4px' : '3px',
                      display: 'block',
                      whiteSpace: 'nowrap'
                    }}>First Name<span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                      name="firstName"
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerInputChange(index, e)}
                      required
                      disabled={!isPreviousPassengerComplete(index)}
                      style={{
                        ...(error?.firstName ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? { 
                          ...mobileInputBase
                        } : {
                          fontSize: '12px',
                          padding: '6px 8px',
                          minHeight: '32px',
                          width: '100%'
                        }),
                        ...(!isPreviousPassengerComplete(index) ? {
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          cursor: 'not-allowed'
                        } : {})
                      }}
                      placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "First Name"}
                    />
                    {error?.firstName && <span style={{ color: 'red', fontSize: 10 }}>First name is required</span>}
                  </div>
                  
                  {/* Last Name */}
                  <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : '140px', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                    <label style={{
                      fontSize: isMobile ? '12px' : '11px',
                      fontWeight: isMobile ? '500' : '500',
                      color: isMobile ? '#374151' : 'inherit',
                      marginBottom: isMobile ? '4px' : '3px',
                      display: 'block',
                      whiteSpace: 'nowrap'
                    }}>Last Name<span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      onInput={e => e.target.value = e.target.value.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, '')}
                      name="lastName"
                      value={passenger.lastName}
                      onChange={(e) => handlePassengerInputChange(index, e)}
                      required
                      disabled={!isPreviousPassengerComplete(index)}
                      style={{
                        ...(error?.lastName ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? { 
                          ...mobileInputBase
                        } : {
                          fontSize: '12px',
                          padding: '6px 8px',
                          minHeight: '32px',
                          width: '100%'
                        }),
                        ...(!isPreviousPassengerComplete(index) ? {
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          cursor: 'not-allowed'
                        } : {})
                      }}
                      placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Last Name"}
                    />
                    {error?.lastName && <span style={{ color: 'red', fontSize: 10 }}>Last name is required</span>}
                  </div>
                  
                  {/* Weight input sadece Buy Gift seçili DEĞİLSE gösterilecek */}
                  {activitySelect !== 'Buy Gift' && (
                    <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : '160px', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '2px', 
                        fontSize: isMobile ? '12px' : '11px',
                        fontWeight: isMobile ? '500' : '500',
                        color: isMobile ? '#374151' : 'inherit',
                        marginBottom: isMobile ? '4px' : '3px',
                        whiteSpace: 'nowrap'
                      }}>
                        Weight (Kg)<span style={{ color: 'red' }}>*</span>
                        <BsInfoCircle 
                          data-tooltip-id={`weight-tooltip-mobile-${index}`}
                          style={{ color: '#3b82f6', cursor: 'pointer', width: 12, height: 12 }} 
                        />
                        <ReactTooltip
                          id={`weight-tooltip-mobile-${index}`}
                          place="top"
                          content="If unknown, enter 0 and contact us before your flight. If exceeding the weight limit please contact the office."
                          style={{
                            maxWidth: '280px',
                            fontSize: '13px',
                            textAlign: 'center',
                            backgroundColor: '#1f2937',
                            color: '#ffffff',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            zIndex: 9999
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        required
                        disabled={!isPreviousPassengerComplete(index)}
                        style={{
                          ...(error?.weight ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? { 
                          ...mobileInputBase
                        } : {
                          fontSize: '12px',
                          padding: '6px 8px',
                          minHeight: '32px',
                          width: '100%'
                        }),
                        ...(!isPreviousPassengerComplete(index) ? {
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          cursor: 'not-allowed'
                        } : {})
                        }}
                        name="weight"
                        value={passenger.weight}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Max 18 Stone / 114Kg"}
                      />
                      {error?.weight && <span style={{ color: 'red', fontSize: 10 }}>Weight is required</span>}
                    </div>
                  )}
                  
                  {/* Phone & Email moved to second row */}
                </div>
                {(activitySelect === 'Buy Gift' || index === 0) && (
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    width: '100%',
                    flexDirection: isMobile ? 'column' : 'row',
                    flexWrap: 'nowrap',
                    marginTop: isMobile ? '0px' : '8px',
                    minWidth: 'max-content'
                  }}>
                    {/* Mobile Number */}
                    <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : '160px', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                      <label style={{
                        fontSize: isMobile ? '12px' : '11px',
                        fontWeight: isMobile ? '500' : '500',
                        color: isMobile ? '#374151' : 'inherit',
                        marginBottom: isMobile ? '4px' : '3px',
                        display: 'block',
                        whiteSpace: 'nowrap'
                      }}>Mobile Number<span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onInput={e => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        name="phone"
                        value={passenger.phone || ''}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Mobile Number"}
                        required
                        disabled={!isPreviousPassengerComplete(index)}
                        style={{
                          ...(error?.phone ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? { 
                          ...mobileInputBase
                        } : {
                          fontSize: '12px',
                          padding: '6px 8px',
                          minHeight: '32px',
                          width: '100%'
                        }),
                        ...(!isPreviousPassengerComplete(index) ? {
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          cursor: 'not-allowed'
                        } : {})
                        }}
                      />
                      {error?.phone && <span style={{ color: 'red', fontSize: 10 }}>Mobile number is required</span>}
                    </div>
                    {/* Email */}
                    <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : '180px', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                      <label style={{
                        fontSize: isMobile ? '12px' : '11px',
                        fontWeight: isMobile ? '500' : '500',
                        color: isMobile ? '#374151' : 'inherit',
                        marginBottom: isMobile ? '4px' : '3px',
                        display: 'block',
                        whiteSpace: 'nowrap'
                      }}>Email<span style={{ color: 'red' }}>*</span></label>
                      <input
                        type="email"
                        name="email"
                        value={passenger.email || ''}
                        onChange={(e) => handlePassengerInputChange(index, e)}
                        placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Email"}
                        required
                        disabled={!isPreviousPassengerComplete(index)}
                        style={{
                          ...(error?.email || emailErrors[index] ? { border: '1.5px solid red' } : {}),
                        ...(isMobile ? { 
                          ...mobileInputBase
                        } : {
                          fontSize: '12px',
                          padding: '6px 8px',
                          minHeight: '32px',
                          width: '100%'
                        }),
                        ...(!isPreviousPassengerComplete(index) ? {
                          backgroundColor: '#f3f4f6',
                          color: '#9ca3af',
                          cursor: 'not-allowed'
                        } : {})
                        }}
                      />
                      {error?.email && <span style={{ color: 'red', fontSize: 10 }}>Email is required</span>}
                      {emailErrors[index] && <span style={{ color: 'red', fontSize: 10 }}>Invalid email format</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
              </div>

              {/* Pagination Dots */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                marginTop: '20px',
                position: 'absolute',
                bottom: '-50px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}>
                {[...Array(passengerCount)].map((_, i) => {
                  const isActive = i === currentPassengerIndex;
                  return (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isActive ? '#03a9f4' : '#ddd',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const container = document.querySelector('.passenger-cards-container');
                        if (container) {
                          const gap = 16;
                          const itemWidth = container.clientWidth - 8 + gap;
                          const targetScrollLeft = i * itemWidth;
                          container.scrollTo({
                            left: targetScrollLeft,
                            behavior: 'smooth'
                          });
                          setCurrentPassengerIndex(i);
                          setCanScrollLeft(i > 0);
                          setCanScrollRight(i < passengerCount - 1);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop: Regular vertical layout */
          <>
            {/* When multiple passengers, show quick navigator chips */}
            {passengerCount > 1 && null}

            {/* Generate passenger forms based on passenger count */}
            {console.log("Rendering passengers, count:", passengerCount, "array:", [...Array(passengerCount)])}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '12px',
              width: '100%',
              // Constrain only the passengers list on mobile so next accordions don't intrude
              maxHeight: isMobile && passengerCount > 1 ? 'calc(100vh - 60px)' : undefined,
              overflowY: isMobile && passengerCount > 1 ? 'auto' : undefined,
              WebkitOverflowScrolling: isMobile && passengerCount > 1 ? 'touch' : undefined
            }}>
            {(() => {
              const isCombinedMobile = isMobile && passengerCount > 1;
              // Order: on mobile, show passengers in natural order (Passenger 1, Passenger 2, ...)
              const indices = [...Array(passengerCount).keys()];
              const ordered = indices;
              return ordered.map((index) => {
              const passenger = passengerData[index] || { firstName: "", lastName: "", weight: "", phone: "", email: "" };
              const error = validationErrors[index] || {};
              console.log(`Rendering passenger ${index + 1}, data:`, passenger);
              return (
                <div id={`passenger-${index+1}`} className={`all-pressenger ${activitySelect === 'Buy Gift' ? 'Purchaser' : ''}`} key={index} style={{ 
                  marginBottom: activitySelect === 'Buy Gift' ? '8px' : (isMobile ? '12px' : '20px'), 
                  padding: activitySelect === 'Buy Gift' ? (isMobile ? '12px' : '10px') : (isMobile ? (isCombinedMobile ? '0' : '20px') : '15px'), 
                  border: isMobile ? (isCombinedMobile ? 'none' : (index > 0 ? '2px solid #d1d5db' : '1px solid #e5e7eb')) : (index > 0 ? '1px solid #eee' : 'none'), 
                  borderRadius: isMobile ? (isCombinedMobile ? '0' : '20px') : '8px', 
                  background: isMobile ? (isCombinedMobile ? 'transparent' : (index > 0 ? '#f8fafc' : '#ffffff')) : (index > 0 ? '#fcfcfd' : 'transparent'),
                  boxShadow: isMobile ? (isCombinedMobile ? 'none' : (index > 0 ? '0 6px 12px rgba(0, 0, 0, 0.15)' : '')) : 'none',
                  width: isMobile ? '100%' : (isMultiPassenger ? '100%' : 'auto'),
                  minWidth: isMobile ? '100%' : (isMultiPassenger ? '100%' : 'auto'),
                  flexShrink: isMobile ? 0 : (isMultiPassenger ? 0 : 1),
                  position: 'relative',
                  zIndex: 1,
                  borderTop: isMobile && !isCombinedMobile && index > 0 ? '4px solid #3b82f6' : 'none'
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
                        fontSize: isMobile ? '16px' : '16px',
                        fontWeight: isMobile ? '500' : '500',
                        color: isMobile ? '#1f2937' : 'inherit',
                        textAlign: isMobile ? 'center' : 'left',
                        width: isMobile ? '100%' : 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {activitySelect === 'Buy Gift' ? 'Your Details – The Purchaser' : `Passenger ${index + 1}`}
                        {index === 0 && (activitySelect === 'Book Flight' || activitySelect === 'Flight Voucher') && (
                          <>
                            <BsInfoCircle 
                              data-tooltip-id={`passenger-info-tooltip-desktop-${index}`}
                              style={{ 
                                color: '#3b82f6', 
                                fontSize: '12px', 
                                cursor: 'pointer',
                                flexShrink: 0
                              }} 
                            />
                            <ReactTooltip
                              id={`passenger-info-tooltip-desktop-${index}`}
                              place="top"
                              content="Your booking confirmation and flight updates will be sent to the contact details provided for Passenger 1."
                              style={{
                                maxWidth: '280px',
                                fontSize: '13px',
                                textAlign: 'center',
                                backgroundColor: '#1f2937',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                zIndex: 9999
                              }}
                            />
                          </>
                        )}
                      </h3>
                    </div>
                    {/* Weather Refundable controls removed (handled in Voucher Type) */}
                  </div>

                  <div className="form-presnger" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: isMobile ? '10px' : '12px',
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0',
                    padding: '0 8px'
                  }}>
                    {/* Row 1: First, Last, Weight */}
                    <div style={{ 
                      display: isMobile ? 'flex' : 'grid',
                      flexDirection: isMobile ? 'column' : 'row',
                      gridTemplateColumns: isMobile ? 'none' : '1fr 1fr 1fr',
                      columnGap: isMobile ? '0' : '12px',
                      rowGap: isMobile ? '8px' : '10px',
                      width: '100%',
                      minWidth: 0,
                      maxWidth: '100%'
                    }}>
                      {/* First Name */}
                      <div style={{ width: '100%', minWidth: 0 }}>
                          <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                          display: 'block',
                          whiteSpace: 'nowrap'
                        }}>First Name<span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            name="firstName"
                            value={passenger.firstName || ''}
                            onChange={(e) => handlePassengerInputChange(index, e)}
                            placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "First Name"}
                            disabled={!isPreviousPassengerComplete(index)}
                            style={{
                              ...(error?.firstName ? { border: '1.5px solid red' } : {}),
                            fontSize: '13px',
                            padding: '8px 10px',
                            minHeight: '36px',
                            width: '100%',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: !isPreviousPassengerComplete(index) ? '#f3f4f6' : '#ffffff',
                                color: !isPreviousPassengerComplete(index) ? '#9ca3af' : '#374151',
                                cursor: !isPreviousPassengerComplete(index) ? 'not-allowed' : 'text',
                                fontWeight: '400',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease'
                            }}
                          />
                          {error?.firstName && <span style={{ color: 'red', fontSize: 11 }}>First name is required</span>}
                        </div>
                      
                      {/* Last Name */}
                      <div style={{ width: '100%', minWidth: 0 }}>
                          <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                          display: 'block',
                          whiteSpace: 'nowrap'
                        }}>Last Name<span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            name="lastName"
                            value={passenger.lastName || ''}
                            onChange={(e) => handlePassengerInputChange(index, e)}
                            placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Last Name"}
                            disabled={!isPreviousPassengerComplete(index)}
                            style={{
                              ...(error?.lastName ? { border: '1.5px solid red' } : {}),
                            fontSize: '13px',
                            padding: '8px 10px',
                            minHeight: '36px',
                            width: '100%',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: !isPreviousPassengerComplete(index) ? '#f3f4f6' : '#ffffff',
                                color: !isPreviousPassengerComplete(index) ? '#9ca3af' : '#374151',
                                cursor: !isPreviousPassengerComplete(index) ? 'not-allowed' : 'text',
                                fontWeight: '400',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease'
                            }}
                          />
                          {error?.lastName && <span style={{ color: 'red', fontSize: 11 }}>Last name is required</span>}
                        </div>
                      
                      {/* Weight input sadece Buy Gift seçili DEĞİLSE gösterilecek */}
                        {activitySelect !== 'Buy Gift' && (
                        <div style={{ width: '100%', minWidth: 0 }}>
                            <label style={{ 
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#374151',
                              marginBottom: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap'
                          }}>
                            Weight (Kg)<span style={{ color: 'red' }}>*</span>
                            <BsInfoCircle 
                              data-tooltip-id={`weight-tooltip-${index}`}
                              style={{ color: '#3b82f6', cursor: 'pointer', width: 12, height: 12 }} 
                            />
                            <ReactTooltip id={`weight-tooltip-${index}`} place="top" content="If unknown, enter 0 and contact us before your flight. If exceeding weight limit please contact the office." />
                          </label>
                              <input
                                type="text"
                                name="weight"
                                value={passenger.weight || ''}
                                onChange={(e) => handlePassengerInputChange(index, e)}
                                placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Max 18 Stone / 114Kg"}
                                disabled={!isPreviousPassengerComplete(index)}
                                style={{
                                  ...(error?.weight ? { border: '1.5px solid red' } : {}),
                              fontSize: '13px',
                              padding: '8px 10px',
                              minHeight: '36px',
                              width: '100%',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '6px',
                                    backgroundColor: !isPreviousPassengerComplete(index) ? '#f3f4f6' : '#ffffff',
                                    color: !isPreviousPassengerComplete(index) ? '#9ca3af' : '#374151',
                                    cursor: !isPreviousPassengerComplete(index) ? 'not-allowed' : 'text',
                                    fontWeight: '400',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              transition: 'all 0.2s ease'
                            }}
                          />
                          {error?.weight && <span style={{ color: 'red', fontSize: 11 }}>Weight is required</span>}
                          </div>
                        )}
                      
                    </div>
                    {/* Row 2: Mobile + Email (only Passenger 1 and Buy Gift) */}
                    {(activitySelect === 'Buy Gift' || index === 0) && (
                      <div style={{ 
                        display: 'flex', 
                        gap: isMobile ? '8px' : '12px', 
                        width: '100%', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        flexWrap: 'nowrap',
                        minWidth: 0,
                        maxWidth: '100%',
                        overflowX: 'hidden'
                      }}>
                        {/* Mobile Number */}
                        <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : 'clamp(160px, 18vw, 220px)', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                           <label style={{ 
                             fontSize: '13px',
                             fontWeight: '500',
                             color: '#374151',
                             marginBottom: '4px',
                            display: 'block',
                            whiteSpace: 'nowrap'
                          }}>Mobile Number<span style={{ color: 'red' }}>*</span></label>
                           <input
                             type="tel"
                             name="phone"
                             value={passenger.phone || ''}
                             onChange={(e) => handlePassengerInputChange(index, e)}
                             placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Mobile Number"}
                             disabled={!isPreviousPassengerComplete(index)}
                             style={{
                               ...(error?.phone ? { border: '1.5px solid red' } : {}),
                              fontSize: '13px',
                              padding: '8px 10px',
                              minHeight: '36px',
                              width: '100%',
                                 border: '1px solid #d1d5db',
                                 borderRadius: '6px',
                                 backgroundColor: !isPreviousPassengerComplete(index) ? '#f3f4f6' : '#ffffff',
                                 color: !isPreviousPassengerComplete(index) ? '#9ca3af' : '#374151',
                                 cursor: !isPreviousPassengerComplete(index) ? 'not-allowed' : 'text',
                                 fontWeight: '400',
                                 boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                 transition: 'all 0.2s ease'
                             }}
                           />
                          {error?.phone && <span style={{ color: 'red', fontSize: 11 }}>Mobile number is required</span>}
                         </div>
                        {/* Email */}
                        <div style={{ flex: isMobile ? 'none' : '0 0 auto', minWidth: isMobile ? '0' : 'clamp(200px, 26vw, 320px)', width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
                          <label style={{ 
                            fontSize: '13px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '4px',
                            display: 'block',
                            whiteSpace: 'nowrap'
                          }}>Email<span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="email"
                            name="email"
                            value={passenger.email || ''}
                            onChange={(e) => handlePassengerInputChange(index, e)}
                            placeholder={!isPreviousPassengerComplete(index) ? "Complete previous passenger first" : "Email"}
                            disabled={!isPreviousPassengerComplete(index)}
                            style={{
                              ...(error?.email || emailErrors[index] ? { border: '1.5px solid red' } : {}),
                              fontSize: '13px',
                              padding: '8px 10px',
                              minHeight: '36px',
                              width: '100%',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                backgroundColor: !isPreviousPassengerComplete(index) ? '#f3f4f6' : '#ffffff',
                                color: !isPreviousPassengerComplete(index) ? '#9ca3af' : '#374151',
                                cursor: !isPreviousPassengerComplete(index) ? 'not-allowed' : 'text',
                                fontWeight: '400',
                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease'
                            }}
                          />
                          {error?.email && <span style={{ color: 'red', fontSize: 11 }}>Email is required</span>}
                          {emailErrors[index] && <span style={{ color: 'red', fontSize: 11 }}>Invalid email format</span>}
                        </div>
                        </div>
                        )}
                  </div>
                </div>
              );
              });
            })()}
            </div>
          </>
        )}
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
