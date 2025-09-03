import React, { useState, useEffect } from "react";
import LOGO from '../../assets/images/FAB_Logo_DarkBlue.png';

import { Container } from "@mui/material";
import ChooseActivityCard from "../components/HomePage/ChooseActivityCard";
import RightInfoCard from "../components/HomePage/RightInfoCard";
import LocationSection from "../components/HomePage/LocationSection";
import ExperienceSection from "../components/HomePage/ExperienceSection";
import VoucherType from "../components/HomePage/VoucherType";
import LiveAvailabilitySection from "../components/HomePage/LiveAvailabilitySection";
import AddOnsSection from "../components/HomePage/AddOnsSection";
import PassengerInfo from "../components/HomePage/PassengerInfo";
import EnterPreferences from "../components/HomePage/EnterPreferences";
import EnterRecipientDetails from "../components/HomePage/EnterRecipientDetails";
import AdditionalInfo from "../components/HomePage/AdditionalInfo";
import BookingHeader from "../components/Common/BookingHeader";
import Accordion from "../components/Common/Accordion";
import axios from "axios";
import "../components/HomePage/RedeemVoucher.css";
import { BsInfoCircle } from "react-icons/bs";
import { useLocation } from 'react-router-dom';

import config from '../../config';
const API_BASE_URL = config.API_BASE_URL;

const Index = () => {
    const [activeAccordion, setActiveAccordion] = useState(null); // Başlangıçta hiçbir accordion seçili değil
    const [activitySelect, setActivitySelect] = useState(null);
    const [chooseLocation, setChooseLocation] = useState(null);
    const [chooseFlightType, setChooseFlightType] = useState({ type: "", passengerCount: "", price: "" });
    const [addPassenger, setAddPassenger] = useState([1, 2]);
    const [chooseAddOn, setChooseAddOn] = useState([]);
    const [passengerData, setPassengerData] = useState([{ firstName: '', lastName: '', weight: '', weatherRefund: false }]);
    const [weatherRefund, setWeatherRefund] = useState(false);
    const [privateCharterWeatherRefund, setPrivateCharterWeatherRefund] = useState(false);
    const [preference, setPreference] = useState({ location: {}, time: {}, day: {} });
    const [recipientDetails, setRecipientDetails] = useState({ name: "", email: "", phone: "", date: "" });
    const [additionalInfo, setAdditionalInfo] = useState({ notes: "" });
    const [selectedDate, setSelectedDate] = useState(null);
    const [activityId, setActivityId] = useState(null);
    const [selectedActivity, setSelectedActivity]= useState([]);
    const [availableSeats, setAvailableSeats] = useState([]);
    const [voucherCode, setVoucherCode] = useState("");
    const [voucherStatus, setVoucherStatus] = useState(null); // "valid", "invalid", or null
    const [voucherData, setVoucherData] = useState(null); // Store validated voucher data
    const [selectedTime, setSelectedTime] = useState(null);
    const [availabilities, setAvailabilities] = useState([]);
    const [selectedVoucherType, setSelectedVoucherType] = useState(null);
    const [countdownSeconds, setCountdownSeconds] = useState(null);

    // NEW: viewport helper for mobile-specific inline tweaks
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debug selectedVoucherType changes
    useEffect(() => {
        console.log('Index.jsx: selectedVoucherType changed to:', selectedVoucherType);
    }, [selectedVoucherType]);
    
    // Payment success popup state
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [paymentSuccessData, setPaymentSuccessData] = useState(null);
    
    
    
    // Close payment success popup
    const closePaymentSuccess = () => {
        setShowPaymentSuccess(false);
        setPaymentSuccessData(null);
    };
    
    // Handle countdown timeout
    const handleCountdownTimeout = () => {
        setSelectedDate(null);
        setSelectedTime(null);
        setCountdownSeconds(null);
    };
    
    // Calculate available capacity for selected date and time
    const getAvailableCapacityForSelection = () => {
        if (!selectedDate || !selectedTime || !availabilities || availabilities.length === 0) {
            return null;
        }
        
        // Create date string manually to avoid timezone issues
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        // Find the matching availability slot for selected date and time
        const matchingSlot = availabilities.find(slot => 
            slot.date === dateStr && slot.time === selectedTime
        );
        
        if (matchingSlot) {
            const capacity = matchingSlot.available || matchingSlot.capacity || 0;
            console.log(`Available capacity for ${dateStr} at ${selectedTime}: ${capacity}`);
            return capacity;
        }
        
        console.log(`No matching slot found for ${dateStr} at ${selectedTime}`);
        return null;
    };
    
    

    
    
    // Function to re-fetch availabilities when filters change
    const refetchAvailabilities = async () => {
        if (chooseLocation && activityId) {
            try {
                const params = new URLSearchParams({
                    location: chooseLocation,
                    activityId: activityId
                });
                
                // Add voucher type filter if selected
                if (selectedVoucherType?.title) {
                    params.append('voucherTypes', selectedVoucherType.title);
                }
                
                // Add flight type filter if selected
                if (chooseFlightType?.type && chooseFlightType.type !== 'Shared Flight') {
                    params.append('flightType', chooseFlightType.type);
                }
                
                // PRODUCTION DEBUG: Log API call details
                console.log('=== refetchAvailabilities DEBUG ===');
                console.log('API_BASE_URL:', API_BASE_URL);
                console.log('Params:', params.toString());
                console.log('Full URL:', `${API_BASE_URL}/api/availabilities/filter?${params.toString()}`);
                console.log('================================');
                
                const response = await axios.get(`${API_BASE_URL}/api/availabilities/filter?${params.toString()}`);
                console.log('API Response:', response.data);
                console.log('Response success:', response.data.success);
                console.log('Response data length:', response.data.data?.length || 0);
                
                if (response.data.success) {
                    setAvailabilities(response.data.data || []);
                    console.log('Availabilities set to:', response.data.data?.length || 0);
                } else {
                    console.log('API returned success: false');
                    console.log('Response error:', response.data.error || 'No error message');
                }
            } catch (error) {
                console.error('Error refetching availabilities:', error);
                console.error('Error details:', error.response?.data);
            }
        } else {
            console.log('refetchAvailabilities skipped - missing chooseLocation or activityId');
        }
    };
    
    // Voucher code validation function
    const validateVoucherCode = async (codeToValidate = null) => {
        const code = codeToValidate || voucherCode;
        
        if (!code.trim()) {
            setVoucherStatus('invalid');
            setVoucherData(null);
            return;
        }

        // For voucher validation, we need at least the code
        // Other fields can be optional for basic validation
        try {
            console.log('Validating voucher code:', code.trim());
            console.log('Validation params:', {
                code: code.trim(),
                location: chooseLocation || 'Somerset', // Default location for testing
                experience: chooseFlightType?.type || 'Private Charter', // Default experience for testing
                voucher_type: selectedVoucherType?.title || 'Weekday Morning', // Default voucher type for testing
                booking_amount: chooseFlightType?.totalPrice || 100 // Default amount for testing
            });

            const response = await axios.post(`${API_BASE_URL}/api/voucher-codes/validate`, {
                code: code.trim(),
                location: chooseLocation || 'Somerset',
                experience: chooseFlightType?.type || 'Private Charter',
                voucher_type: selectedVoucherType?.title || 'Weekday Morning',
                booking_amount: chooseFlightType?.totalPrice || 100
            });

            console.log('Voucher validation response:', response.data);

            if (response.data.success) {
                setVoucherStatus('valid');
                setVoucherData(response.data.data);
                
                // Update total price with discount if available
                if (chooseFlightType?.totalPrice) {
                    const discountedPrice = response.data.data.final_amount;
                    setChooseFlightType(prev => ({
                        ...prev,
                        totalPrice: discountedPrice,
                        originalPrice: chooseFlightType.totalPrice
                    }));
                }
                
                console.log('Voucher code validated successfully:', response.data.data);
            } else {
                setVoucherStatus('invalid');
                setVoucherData(null);
                // Clear voucher code from summary when validation fails
                setVoucherCode('');
                
                // Daha detaylı hata mesajları göster
                const errorMessage = response.data.message || 'Voucher code validation failed';
                console.log('Voucher validation failed:', errorMessage);
                
                // Kullanıcıya daha açıklayıcı mesaj göster
                if (errorMessage.includes('usage limit reached')) {
                    alert(`Bu voucher code artık kullanılamaz: ${errorMessage}`);
                } else if (errorMessage.includes('expired')) {
                    alert(`Bu voucher code süresi dolmuş: ${errorMessage}`);
                } else if (errorMessage.includes('not yet valid')) {
                    alert(`Bu voucher code henüz geçerli değil: ${errorMessage}`);
                } else if (errorMessage.includes('inactive')) {
                    alert(`Bu voucher code aktif değil: ${errorMessage}`);
                } else {
                    alert(`Voucher code hatası: ${errorMessage}`);
                }
            }
        } catch (error) {
            console.error('Error validating voucher code:', error);
            setVoucherStatus('invalid');
            setVoucherData(null);
        }
    };

    // Refetch availabilities when voucher type changes
    useEffect(() => {
        if (selectedVoucherType && chooseLocation && activityId) {
            refetchAvailabilities();
        }
    }, [selectedVoucherType, chooseLocation, activityId]);
    
    // Refetch availabilities when flight type changes
    useEffect(() => {
        if (chooseFlightType?.type && chooseLocation && activityId) {
            refetchAvailabilities();
        }
    }, [chooseFlightType?.type, chooseLocation, activityId]);
    
    // Validation refs for Buy Gift and Flight Voucher
    const recipientDetailsRef = React.useRef();
    const passengerInfoRef = React.useRef();
    const additionalInfoRef = React.useRef();
    
    // Weather Refundable is now part of Passenger Information, not Add To Booking
    // useEffect removed - Weather Refundable will be handled directly in Passenger Information display
    
    const isFlightVoucher = activitySelect === "Flight Voucher";
    const isRedeemVoucher = activitySelect === "Redeem Voucher";
    const isGiftVoucher = activitySelect === "Buy Gift";
    const isBookFlight = activitySelect === "Book Flight";
    console.log('chooseFlightType', chooseFlightType);

    // Lokasyon ve tarih seçilip seçilmediğini kontrol et
    const showBookingHeader = chooseLocation && selectedDate && selectedTime;

    // Diğer section'lar için özel bir setActiveAccordion fonksiyonu
    // activitySelect null ise section'ların açılmasını engeller
    const handleSetActiveAccordion = (sectionId) => {
        if (activitySelect === null) {
            return; // Eğer aktivite seçilmediyse, hiçbir şey yapma
        }
        setActiveAccordion(sectionId); // Aktivite seçildiyse normal davran
    };

    // Validation function for all activity types
    const validateBuyGiftFields = () => {
        let isValid = true;
        
        // Validate Recipient Details (only for Buy Gift)
        if (activitySelect === "Buy Gift" && recipientDetailsRef.current) {
            const recipientValid = recipientDetailsRef.current.validate();
            if (!recipientValid) {
                setActiveAccordion("recipent-details");
                isValid = false;
            }
        }
        
        // Validate Passenger Information (for all activity types)
        if (passengerInfoRef.current) {
            const passengerValid = passengerInfoRef.current.validate();
            if (!passengerValid) {
                setActiveAccordion("passenger-info");
                isValid = false;
            }
        }
        
        // Validate Additional Information (for all activity types)
        if (additionalInfoRef.current) {
            const additionalValid = additionalInfoRef.current.validate();
            if (!additionalValid) {
                setActiveAccordion("additional-info");
                isValid = false;
            }
        }
        
        // For Redeem Voucher, also validate that Live Availability is selected
        if (activitySelect === "Redeem Voucher" && (!selectedDate || !selectedTime)) {
            setActiveAccordion("live-availability");
            isValid = false;
        }
        
        // For Flight Voucher, validate that all required fields are filled
        if (activitySelect === "Flight Voucher") {
            // PassengerInfo validation is already handled in validateBuyGiftFields
            // Additional validation can be added here if needed
        }
        
        // For Buy Gift, validate that all required fields are filled
        if (activitySelect === "Buy Gift") {
            // PassengerInfo validation is already handled in validateBuyGiftFields
            // Additional validation can be added here if needed
        }
        
        return isValid;
    };

    // Handle voucher code submission
    const handleVoucherSubmit = (code) => {
        setVoucherCode(code);
        setActivitySelect("Redeem Voucher");
        
        // Always trigger voucher validation when code is submitted
        // Use default values if other fields are not selected yet
        validateVoucherCode(code);
        
        // Don't automatically move to the location section
        // setTimeout(() => {
        //     setActiveAccordion("location");
        // }, 500);
    };

    useEffect(() => {
        if (activitySelect === "Book Flight" || activitySelect === "Redeem Voucher") {
            setActiveAccordion("location");
        } else if (activitySelect === "Flight Voucher" || activitySelect === "Buy Gift") {
            setActiveAccordion("experience");
        } else {
            setActiveAccordion(null);
        }
    }, [activitySelect]);

    // Eğer Flight Voucher ise, passengerData'dan name'i otomatik doldur
    useEffect(() => {
        if (activitySelect === "Flight Voucher" && passengerData.length > 0) {
            const firstPassenger = passengerData[0];
            const fullName = `${firstPassenger.firstName} ${firstPassenger.lastName}`.trim();
            if (fullName && fullName !== recipientDetails.name) {
                setRecipientDetails((prev) => ({ ...prev, name: fullName }));
            }
        }
    }, [activitySelect, passengerData]);

    // Reset all booking selections
    const resetBooking = () => {
        setActiveAccordion("activity");
        setActivitySelect(null);
        setChooseLocation(null);
        setChooseFlightType({ type: "", passengerCount: "", price: "" });
        setAddPassenger([1, 2]);
        setChooseAddOn([]);
        setPassengerData([{ firstName: '', lastName: '', weight: '', weatherRefund: false }]);
        setWeatherRefund(false);
        setPrivateCharterWeatherRefund(false);
        setPreference({ location: {}, time: {}, day: {} });
        setRecipientDetails({ name: "", email: "", phone: "", date: "" });
        setAdditionalInfo({ notes: "" });
        setSelectedDate(null);
        setActivityId(null);
        setSelectedActivity([]);
        setAvailableSeats([]);
        setVoucherCode("");
        setVoucherStatus(null);
        setVoucherData(null);
        setSelectedVoucherType(null);
    };

    useEffect(() => {
        // Live Availability accordion'u açıldığında ve lokasyon seçildiğinde güncel availabilities çek
        const fetchAvailabilities = async () => {
            if (chooseLocation && activeAccordion === "live-availability") {
                try {
                    // Build query parameters for filtered availabilities
                    const params = new URLSearchParams({
                        location: chooseLocation,
                        activityId: activityId
                    });
                    
                    // Add flight type if selected - map UI values to backend values
                    if (chooseFlightType && chooseFlightType.type) {
                        let flightTypeForBackend;
                        if (chooseFlightType.type === 'Private Charter') {
                            flightTypeForBackend = 'Private';
                        } else if (chooseFlightType.type === 'Shared Flight') {
                            flightTypeForBackend = 'Shared';
                        } else {
                            flightTypeForBackend = chooseFlightType.type;
                        }
                        // Only add flight type filter if a voucher type is also selected
                        // This allows showing all availabilities when no voucher type is selected
                        if (selectedVoucherType && selectedVoucherType.title) {
                            params.append('flightType', flightTypeForBackend);
                        }
                    }
                    
                    // Add voucher types if selected (TEMPORARILY DISABLED FOR DEBUG)
                    if (selectedVoucherType && selectedVoucherType.title) {
                        console.log('⚠️ Voucher Type filter temporarily disabled for debugging');
                        console.log('Original filter would be:', selectedVoucherType.title);
                        // params.append('voucherTypes', selectedVoucherType.title); // TEMPORARILY COMMENTED OUT
                    } else if (activitySelect === 'Book Flight') {
                        // For Book Flight, if no voucher type is selected, show all availabilities
                        console.log('⚠️ Voucher Types filter set to All (temporarily disabled)');
                        // params.append('voucherTypes', 'All'); // TEMPORARILY COMMENTED OUT
                    }
                    
                    const url = `${API_BASE_URL}/api/availabilities/filter?${params.toString()}`;
                    console.log('Fetching availabilities with URL:', url);
                    console.log('Parameters:', {
                        location: chooseLocation,
                        flightType: chooseFlightType?.type,
                        voucherType: selectedVoucherType?.title,
                        activitySelect
                    });
                    
                    const response = await axios.get(url);
                    if (response.status === 200 && response.data.success) {
                        const avails = response.data.data || [];
                        console.log('Received availabilities:', avails);
                        setAvailabilities(avails);
                    } else {
                        console.log('No availabilities received or error');
                        setAvailabilities([]);
                    }
                } catch (error) {
                    console.error('Error fetching availabilities:', error);
                    setAvailabilities([]);
                }
            }
        };
        fetchAvailabilities();
    }, [chooseLocation, activeAccordion, chooseFlightType, selectedVoucherType]);

    // Update chooseFlightType when selectedVoucherType changes to sync passenger count
    useEffect(() => {
        if (selectedVoucherType && selectedVoucherType.quantity) {
            setChooseFlightType(prev => ({
                ...prev,
                passengerCount: selectedVoucherType.quantity.toString()
            }));
        }
    }, [selectedVoucherType]);



    // Yeni: activitySelect değiştiğinde tüm booking state'lerini sıfırla
    React.useEffect(() => {
        if (activitySelect !== null) {
            setChooseLocation(null);
            setChooseFlightType({ type: '', passengerCount: '', price: '' });
            setAddPassenger([1, 2]);
            setChooseAddOn([]);
                    setPassengerData([{ firstName: '', lastName: '', weight: '', phone: '', email: '', weatherRefund: false }]);
        setWeatherRefund(false);
        setPrivateCharterWeatherRefund(false);
            setPreference({ location: {}, time: {}, day: {} });
            setRecipientDetails({ name: '', email: '', phone: '', date: '' });
            setAdditionalInfo({ notes: '' });
            setSelectedDate(null);
            setActivityId(null);
            setSelectedActivity([]);
            setAvailableSeats([]);
            setVoucherCode('');
            setVoucherStatus(null);
            setSelectedVoucherType(null); // Reset voucher type when activity changes
        }
    }, [activitySelect]);

    const location = useLocation();
    const [paymentProcessed, setPaymentProcessed] = React.useState(false);
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('payment') === 'success' && !paymentProcessed) {
            const session_id = params.get('session_id');
            const type = params.get('type');
            
            if (session_id && type) {
                // Mark as processed to prevent duplicate calls in this tab
                setPaymentProcessed(true);
                
                // Try to create booking/voucher using fallback endpoint
                const createFromSession = async () => {
                    try {
                        // Cross-tab/reload guard
                        const processedKey = `fab_payment_processed_${session_id}`;
                        if (localStorage.getItem(processedKey) === '1') {
                            console.log('Payment already processed in this browser session, skipping.');
                            return;
                        }
                        
                        // Ask backend first if this session was already processed
                        const statusResp = await axios.get(`${API_BASE_URL}/api/session-status`, { params: { session_id } });
                        if (statusResp.data?.processed) {
                            console.log('Session already processed on server, skipping fallback creation.');
                            localStorage.setItem(processedKey, '1');
                            return; // Avoid duplicate creation
                        }
                        const response = await axios.post(`${API_BASE_URL}/api/createBookingFromSession`, {
                            session_id,
                            type
                        });
                        
                        // Mark as processed after server handles it
                        localStorage.setItem(processedKey, '1');
                        
                        if (response.data.success) {
                            // For Flight Vouchers, Buy Gift vouchers, and Book Flight, generate voucher code if not already generated
                            let finalVoucherCode = response.data.voucher_code;
                            
                            if ((type === 'voucher' || type === 'booking') && !finalVoucherCode) {
                                try {
                                    // Determine voucher type and generate appropriate code
                                    let voucherType = 'Flight Voucher'; // Default
                                    let flightCategory = 'Any Day Flight'; // Default
                                    
                                    // Check voucher type and generate appropriate code
                                    if (response.data.voucher_type === 'Buy Gift' || response.data.voucher_type === 'Gift Voucher') {
                                        voucherType = 'Gift Voucher';
                                        console.log('Generating voucher code for Gift Voucher...');
                                    } else if (response.data.voucher_type === 'Book Flight') {
                                        voucherType = 'Book Flight';
                                        console.log('Generating voucher code for Book Flight...');
                                    } else {
                                        voucherType = 'Flight Voucher';
                                        console.log('Generating voucher code for Flight Voucher...');
                                    }
                                    
                                    // Determine flight category based on voucher type detail
                                    // For Book Flight, we need to get the voucher type from the current state
                                    if (type === 'booking' && selectedVoucherType) {
                                        const voucherTypeTitle = selectedVoucherType.title;
                                        console.log('Selected Voucher Type Title:', voucherTypeTitle);
                                        console.log('Full selectedVoucherType:', selectedVoucherType);
                                        
                                        if (voucherTypeTitle === 'Weekday Morning') {
                                            flightCategory = 'Weekday Morning';
                                        } else if (voucherTypeTitle === 'Flexible Weekday') {
                                            flightCategory = 'Weekday Flex';
                                        } else if (voucherTypeTitle === 'Any Day Flight') {
                                            flightCategory = 'Any Day Flight';
                                        }
                                        
                                        console.log('Frontend Flight Category:', flightCategory);
                                    } else if (response.data.voucher_type_detail) {
                                        const voucherTypeDetail = response.data.voucher_type_detail;
                                        if (voucherTypeDetail === 'Weekday Morning') {
                                            flightCategory = 'Weekday Morning';
                                        } else if (voucherTypeDetail === 'Flexible Weekday') {
                                            flightCategory = 'Weekday Flex';
                                        } else if (voucherTypeDetail === 'Any Day Flight') {
                                            flightCategory = 'Any Day Flight';
                                        }
                                    }
                                    
                                    // If still default, try to get from the current state
                                    if (flightCategory === 'Any Day Flight' && selectedVoucherType) {
                                        console.log('Falling back to current state selectedVoucherType');
                                        const fallbackTitle = selectedVoucherType.title;
                                        if (fallbackTitle === 'Weekday Morning') {
                                            flightCategory = 'Weekday Morning';
                                        } else if (fallbackTitle === 'Flexible Weekday') {
                                            flightCategory = 'Weekday Flex';
                                        } else if (fallbackTitle === 'Any Day Flight') {
                                            flightCategory = 'Any Day Flight';
                                        }
                                        console.log('Fallback Flight Category:', flightCategory);
                                    }
                                    
                                    // DISABLED: Voucher code generation moved to backend to prevent duplicates
                                    // Backend now handles voucher code generation in createBookingFromSession
                                    console.log('Frontend voucher code generation disabled - backend handles this now');
                                    
                                    // Try to get voucher code from backend response
                                    if (response.data.voucher_code) {
                                        finalVoucherCode = response.data.voucher_code;
                                        console.log('Using voucher code from backend:', finalVoucherCode);
                                    } else {
                                        console.log('No voucher code in backend response, will be generated by backend later');
                                    }
                                } catch (voucherCodeError) {
                                    console.error('Error generating voucher code:', voucherCodeError);
                                    // Continue even if code generation fails
                                }
                            }
                            
                            // Set payment success data for popup
                            setPaymentSuccessData({
                                type: type,
                                id: response.data.id,
                                voucherCode: finalVoucherCode,
                                customerName: response.data.customer_name || null,
                                customerEmail: response.data.customer_email || null,
                                paidAmount: response.data.paid_amount || null,
                                message: type === 'booking' ? 'reservation' : 'voucher'
                            });
                            setShowPaymentSuccess(true);
                        } else {
                            console.warn('Payment succeeded but backend did not return success. Skipping alert because entry is already created.');
                        }
                    } catch (error) {
                        console.error('Error creating from session:', error);
                        // Do not alert the user; booking creation is idempotent and may already exist
                    }
                };
                
                createFromSession();
            } else {
                // No session or type; nothing to process. Avoid noisy alerts.
            }
            
            // URL'den payment parametresini temizle
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (params.get('payment') === 'cancel') {
            alert('Ödeme iptal edildi.');
            // URL'den payment parametresini temizle
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [location, paymentProcessed]);

    return (
        <div className="final-booking-wrap">
            <div className="header-bg">
                <div className="header-layout">
                    <Container>
                        <div className="header-flex-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: '80px' }}>
                            <div className="logo" style={{ marginRight: isMobile ? '12px' : '32px', flexShrink: 0, minWidth: isMobile ? 'auto' : '200px' }}>
                                <a href="/" onClick={e => { e.preventDefault(); window.location.reload(); }} style={{ display: 'inline-block' }}>
                                    <img src={LOGO} alt="Fly Away Ballooning Logo" style={{ height: isMobile ? 35 : undefined, width: 'auto' }} />
                                </a>
                            </div>
                            {showBookingHeader && (
                                <BookingHeader 
                                    location={chooseLocation} 
                                    selectedDate={selectedDate} 
                                    selectedTime={selectedTime} 
                                    countdownSeconds={countdownSeconds}
                                    onTimeout={handleCountdownTimeout}
                                />
                            )}

                        </div>
                    </Container>
                </div>
            </div>
            <Container>
                <div className="main-content">
                    <div className="header-top">
                        
                    </div>
                    <div className="main_booking">
                        <div className="booking_data">
                            <div className={`accodien ${isMobile ? 'mobile-optimized' : ''}`}>
                                {/* What would you like to do? Accordion */}
                                <div style={{ 
                                    marginBottom: isMobile ? '15px' : '30px',
                                    padding: isMobile ? '0 8px' : '0'
                                }}>
                                    <h3 style={{ 
                                        fontSize: isMobile ? '16px' : '17px', 
                                        textAlign: 'center', 
                                        marginBottom: isMobile ? '10px' : '20px',
                                        marginTop: isMobile ? '5px' : '0'
                                    }}>What would you like to do?</h3>
                                    <ChooseActivityCard 
                                        activitySelect={activitySelect} 
                                        setActivitySelect={setActivitySelect} 
                                        onVoucherSubmit={handleVoucherSubmit}
                                        voucherStatus={voucherStatus}
                                        voucherCode={voucherCode}
                                        voucherData={voucherData}
                                        onValidate={validateVoucherCode}
                                    />
                                </div>
                                {/* Diğer section'lar - deaktif görünecek şekilde stil */}
                                <div style={{ opacity: activitySelect === null ? '0.5' : '1', pointerEvents: activitySelect === null ? 'none' : 'auto' }}>
                                    {activitySelect === "Book Flight" ? (
                                        <>
                                            <LocationSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isRedeemVoucher={isRedeemVoucher}
                                                chooseLocation={chooseLocation} 
                                                setChooseLocation={setChooseLocation} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                setActivityId={setActivityId} 
                                                setSelectedActivity={setSelectedActivity}
                                                setAvailabilities={setAvailabilities}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                            />
                                            <ExperienceSection 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                setChooseFlightType={setChooseFlightType} 
                                                addPassenger={addPassenger} 
                                                setAddPassenger={setAddPassenger} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                setAvailableSeats={setAvailableSeats}
                                                voucherCode={voucherCode}
                                                chooseLocation={chooseLocation}
                                                isFlightVoucher={isFlightVoucher}
                                                isBookFlight={isBookFlight}
                                                isGiftVoucher={isGiftVoucher}
                                            />
                                            {chooseLocation !== "Bristol Fiesta" && (
                                                <VoucherType 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    selectedVoucherType={selectedVoucherType} 
                                                    setSelectedVoucherType={setSelectedVoucherType}
                                                    activitySelect={activitySelect}
                                                    chooseFlightType={chooseFlightType}
                                                    chooseLocation={chooseLocation}
                                                    selectedActivity={selectedActivity}
                                                    availableCapacity={getAvailableCapacityForSelection()}
                                                    selectedDate={selectedDate}
                                                    selectedTime={selectedTime}
                                                />
                                            )}
                                            <LiveAvailabilitySection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                selectedDate={selectedDate} 
                                                setSelectedDate={setSelectedDate} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                selectedActivity={selectedActivity} 
                                                availableSeats={availableSeats} 
                                                chooseLocation={chooseLocation}
                                                selectedTime={selectedTime}
                                                setSelectedTime={setSelectedTime}
                                                availabilities={availabilities}
                                                activitySelect={activitySelect}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                                countdownSeconds={countdownSeconds}
                                                setCountdownSeconds={setCountdownSeconds}
                                                onTimeout={handleCountdownTimeout}
                                            />
                                            <PassengerInfo
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordion}
                                                chooseFlightType={chooseFlightType}
                                                addPassenger={addPassenger}
                                                setAddPassenger={setAddPassenger}
                                                chooseLocation={chooseLocation}
                                                activitySelect={activitySelect}
                                                title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
                                                selectedVoucherType={selectedVoucherType}
                                                privateCharterWeatherRefund={privateCharterWeatherRefund}
                                                setPrivateCharterWeatherRefund={setPrivateCharterWeatherRefund}
                                            />
                                            <AdditionalInfo 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isBookFlight={isBookFlight}
                                                additionalInfo={additionalInfo} 
                                                setAdditionalInfo={setAdditionalInfo} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion}
                                                flightType={chooseFlightType.type}
                                            />
                                            
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                                disabled={false}
                                            />
                                            {console.log('🔍 AddOnsSection called with:', {
                                                activitySelect,
                                                chooseLocation,
                                                flightType: chooseFlightType.type,
                                                isGiftVoucher,
                                                isRedeemVoucher,
                                                isFlightVoucher
                                            })}
                                        </>
                                    ) : activitySelect === "Redeem Voucher" ? (
                                        <>
                                            <LocationSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isRedeemVoucher={isRedeemVoucher}
                                                chooseLocation={chooseLocation} 
                                                setChooseLocation={setChooseLocation} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                setActivityId={setActivityId} 
                                                setSelectedActivity={setSelectedActivity}
                                                setAvailabilities={setAvailabilities}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                            />
                                            <LiveAvailabilitySection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                selectedDate={selectedDate} 
                                                setSelectedDate={setSelectedDate} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                selectedActivity={selectedActivity} 
                                                availableSeats={availableSeats} 
                                                chooseLocation={chooseLocation}
                                                selectedTime={selectedTime}
                                                setSelectedTime={setSelectedTime}
                                                availabilities={availabilities}
                                                activitySelect={activitySelect}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                                countdownSeconds={countdownSeconds}
                                                setCountdownSeconds={setCountdownSeconds}
                                                onTimeout={handleCountdownTimeout}
                                            />
                                            <PassengerInfo
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordion}
                                                chooseFlightType={chooseFlightType}
                                                addPassenger={addPassenger}
                                                setAddPassenger={setAddPassenger}
                                                chooseLocation={chooseLocation}
                                                activitySelect={activitySelect}
                                                title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
                                                selectedVoucherType={selectedVoucherType}
                                                privateCharterWeatherRefund={privateCharterWeatherRefund}
                                                setPrivateCharterWeatherRefund={setPrivateCharterWeatherRefund}
                                            />
                                            <AdditionalInfo 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isBookFlight={isBookFlight}
                                                additionalInfo={additionalInfo} 
                                                setAdditionalInfo={setAdditionalInfo} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion}
                                                flightType={chooseFlightType.type}
                                            />
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                            />
                                            {console.log('🔍 AddOnsSection (Redeem Voucher) called with:', {
                                                activitySelect,
                                                chooseLocation,
                                                flightType: chooseFlightType.type,
                                                isGiftVoucher,
                                                isRedeemVoucher,
                                                isFlightVoucher
                                            })}
                                        </>
                                    ) : activitySelect === "Flight Voucher" ? (
                                        <>
                                            <ExperienceSection 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                setChooseFlightType={setChooseFlightType} 
                                                addPassenger={addPassenger} 
                                                setAddPassenger={setAddPassenger} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                setAvailableSeats={setAvailableSeats}
                                                voucherCode={voucherCode}
                                                chooseLocation={chooseLocation}
                                                isFlightVoucher={isFlightVoucher}
                                                isBookFlight={isBookFlight}
                                                isGiftVoucher={isGiftVoucher}
                                            />
                                            {chooseLocation !== "Bristol Fiesta" && (
                                                <VoucherType 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    selectedVoucherType={selectedVoucherType} 
                                                    setSelectedVoucherType={setSelectedVoucherType}
                                                    activitySelect={activitySelect}
                                                    chooseFlightType={chooseFlightType}
                                                    chooseLocation={chooseLocation}
                                                    selectedActivity={selectedActivity}
                                                    availableCapacity={getAvailableCapacityForSelection()}
                                                    selectedDate={selectedDate}
                                                    selectedTime={selectedTime}
                                                />
                                            )}
                                            <PassengerInfo
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordion}
                                                chooseFlightType={chooseFlightType}
                                                addPassenger={addPassenger}
                                                setAddPassenger={setAddPassenger}
                                                chooseLocation={chooseLocation}
                                                activitySelect={activitySelect}
                                                title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
                                            />
                                            <AdditionalInfo 
                                                ref={additionalInfoRef}
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isBookFlight={isBookFlight}
                                                additionalInfo={additionalInfo} 
                                                setAdditionalInfo={setAdditionalInfo} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion}
                                                flightType={chooseFlightType.type}
                                                location={chooseLocation}
                                            />
                                            {/* EnterPreferences removed for Flight Voucher */}
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordion} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                            />
                                            {console.log('🔍 AddOnsSection (Flight Voucher) called with:', {
                                                activitySelect,
                                                chooseLocation,
                                                flightType: chooseFlightType.type,
                                                isGiftVoucher,
                                                isRedeemVoucher,
                                                isFlightVoucher
                                            })}
                                        </>
                                    ) : (
                                        <>
                                            {!(activitySelect === "Flight Voucher" || activitySelect === "Buy Gift") && (
                                                <LocationSection 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    chooseLocation={chooseLocation} 
                                                    setChooseLocation={setChooseLocation} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    setActivityId={setActivityId} 
                                                    setSelectedActivity={setSelectedActivity}
                                                    setAvailabilities={setAvailabilities}
                                                    selectedVoucherType={selectedVoucherType}
                                                    chooseFlightType={chooseFlightType}
                                                />
                                            )}
                                            {!(activitySelect === "Redeem Voucher") && (
                                                <ExperienceSection 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    setChooseFlightType={setChooseFlightType} 
                                                    addPassenger={addPassenger} 
                                                    setAddPassenger={setAddPassenger} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    setAvailableSeats={setAvailableSeats}
                                                    voucherCode={voucherCode}
                                                    chooseLocation={chooseLocation}
                                                    isFlightVoucher={isFlightVoucher}
                                                    isBookFlight={isBookFlight}
                                                    isGiftVoucher={isGiftVoucher}
                                                />
                                            )}
                                            {activitySelect === "Buy Gift" && chooseLocation !== "Bristol Fiesta" && (
                                                <VoucherType 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    selectedVoucherType={selectedVoucherType} 
                                                    setSelectedVoucherType={setSelectedVoucherType}
                                                    activitySelect={activitySelect}
                                                    chooseFlightType={chooseFlightType}
                                                    chooseLocation={chooseLocation}
                                                    selectedActivity={selectedActivity}
                                                    availableCapacity={getAvailableCapacityForSelection()}
                                                    selectedDate={selectedDate}
                                                    selectedTime={selectedTime}
                                                />
                                            )}
                                            {!(activitySelect === "Flight Voucher" || activitySelect === "Redeem Voucher" || activitySelect === "Buy Gift") && (
                                                <LiveAvailabilitySection 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    selectedDate={selectedDate} 
                                                    setSelectedDate={setSelectedDate} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    selectedActivity={selectedActivity} 
                                                    availableSeats={availableSeats} 
                                                    chooseLocation={chooseLocation}
                                                    selectedTime={selectedTime}
                                                    setSelectedTime={setSelectedTime}
                                                    availabilities={availabilities}
                                                    activitySelect={activitySelect}
                                                    selectedVoucherType={selectedVoucherType}
                                                    chooseFlightType={chooseFlightType}
                                                />
                                            )}
                                            {(activitySelect === "Redeem Voucher") && (
                                                <AddOnsSection 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    chooseAddOn={chooseAddOn} 
                                                    setChooseAddOn={setChooseAddOn} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    chooseLocation={chooseLocation} 
                                                    chooseFlightType={chooseFlightType} 
                                                    activitySelect={activitySelect}
                                                    flightType={chooseFlightType.type}
                                                />
                                            )}
                                            {console.log('🔍 AddOnsSection (Buy Gift/Redeem Voucher) called with:', {
                                                activitySelect,
                                                chooseLocation,
                                                flightType: chooseFlightType.type,
                                                isGiftVoucher,
                                                isRedeemVoucher,
                                                isFlightVoucher
                                            })}
                                            {/* For Buy Gift: show Purchaser Information before Recipient Details */}
                                            <PassengerInfo
                                                ref={passengerInfoRef}
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordion}
                                                chooseFlightType={chooseFlightType}
                                                addPassenger={addPassenger}
                                                setAddPassenger={setAddPassenger}
                                                chooseLocation={chooseLocation}
                                                activitySelect={activitySelect}
                                                title={activitySelect === 'Buy Gift' ? 'Purchaser Information' : 'Passenger Information'}
                                                selectedVoucherType={selectedVoucherType}
                                                privateCharterWeatherRefund={privateCharterWeatherRefund}
                                                setPrivateCharterWeatherRefund={setPrivateCharterWeatherRefund}
                                            />
                                            {activitySelect === "Buy Gift" && (
                                                <EnterRecipientDetails 
                                                    ref={recipientDetailsRef}
                                                    isBookFlight={isBookFlight}
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    isGiftVoucher={isGiftVoucher}
                                                    recipientDetails={recipientDetails} 
                                                    setRecipientDetails={setRecipientDetails} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion}
                                                />
                                            )}

                                            {/* For Buy Gift, move Add To Booking below Purchaser Information */}
                                            {activitySelect === "Buy Gift" && (
                                                <AddOnsSection 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    chooseAddOn={chooseAddOn} 
                                                    setChooseAddOn={setChooseAddOn} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion} 
                                                    chooseLocation={chooseLocation} 
                                                    chooseFlightType={chooseFlightType} 
                                                    activitySelect={activitySelect}
                                                    flightType={chooseFlightType.type}
                                                />
                                            )}

                                            {(activitySelect === "Book Flight" || activitySelect === "Redeem Voucher" || activitySelect === "Flight Voucher") && chooseLocation !== "Bristol Fiesta" && (
                                                <AdditionalInfo 
                                                    ref={additionalInfoRef}
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    isBookFlight={isBookFlight}
                                                    additionalInfo={additionalInfo} 
                                                    setAdditionalInfo={setAdditionalInfo} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion}
                                                    flightType={chooseFlightType.type}
                                                    location={chooseLocation}
                                                />
                                            )}
                                            {(activitySelect === "Book Flight" || activitySelect === "Redeem Voucher") && (
                                                <EnterPreferences 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    preference={preference} 
                                                    setPreference={setPreference} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordion}
                                                />
                                            )}

                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="booking_info">
                            <RightInfoCard
                                activitySelect={activitySelect}
                                chooseLocation={chooseLocation}
                                chooseFlightType={chooseFlightType}
                                chooseAddOn={chooseAddOn}
                                passengerData={passengerData}
                                additionalInfo={additionalInfo}
                                recipientDetails={recipientDetails}
                                selectedDate={selectedDate}
                                selectedTime={selectedTime}
                                activeAccordion={activeAccordion}
                                setActiveAccordion={setActiveAccordion}
                                isFlightVoucher={isFlightVoucher}
                                isRedeemVoucher={isRedeemVoucher}
                                isGiftVoucher={isGiftVoucher}
                                voucherCode={voucherCode}
                                resetBooking={resetBooking}
                                preference={preference}
                                validateBuyGiftFields={validateBuyGiftFields}
                                selectedVoucherType={selectedVoucherType}
                                voucherStatus={voucherStatus}
                                voucherData={voucherData}
                                privateCharterWeatherRefund={privateCharterWeatherRefund}
                            />
                        </div>
                    </div>
                </div>
            </Container>
            
            {/* Payment Success Popup */}
            {showPaymentSuccess && paymentSuccessData && (
                <div className="payment-success-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="payment-success-popup" style={{
                        backgroundColor: 'white',
                        borderRadius: '14px',
                        padding: '24px',
                        maxWidth: '420px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 16px 32px rgba(0, 0, 0, 0.25)',
                        position: 'relative'
                    }}>
                        {/* Success Icon */}
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '32px',
                            color: 'white'
                        }}>
                            ✓
                        </div>
                        
                        {/* Success Message */}
                        <h2 style={{
                            color: '#1f2937',
                            fontSize: '22px',
                            fontWeight: '600',
                            marginBottom: '12px'
                        }}>
                            Payment Successfully Received!
                        </h2>
                        
                        <p style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            marginBottom: '16px',
                            lineHeight: '1.4'
                        }}>
                            Your {paymentSuccessData.message} has been created successfully.
                        </p>
                        
                        {/* Voucher Code Display - Always show for vouchers */}
                        <div style={{
                            backgroundColor: '#f3f4f6',
                            borderRadius: '10px',
                            padding: '16px',
                            marginBottom: '16px',
                            border: '2px solid #3b82f6'
                        }}>
                            <p style={{
                                color: '#374151',
                                fontSize: '14px',
                                marginBottom: '8px',
                                fontWeight: '500'
                            }}>
                                Voucher Code:
                            </p>
                            <div style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '700',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                letterSpacing: '2px',
                                fontFamily: 'monospace'
                            }}>
                                {paymentSuccessData.voucherCode || 'Voucher Code Not Available'}
                            </div>
                            {/* Note removed per request */}
                        </div>
                        
                        {/* Customer Information */}
                        {paymentSuccessData.customerName && (
                            <div style={{
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '12px'
                            }}>
                                <p style={{
                                    color: '#374151',
                                    fontSize: '14px',
                                    marginBottom: '4px'
                                }}>
                                    Customer:
                                </p>
                                <p style={{
                                    color: '#1f2937',
                                    fontSize: '18px',
                                    fontWeight: '600'
                                }}>
                                    {paymentSuccessData.customerName}
                                </p>
                                {paymentSuccessData.customerEmail && (
                                    <p style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginTop: '4px'
                                    }}>
                                        {paymentSuccessData.customerEmail}
                                    </p>
                                )}
                            </div>
                        )}
                        
                        {/* Paid Amount */}
                        {paymentSuccessData.paidAmount && (
                            <div style={{
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '12px'
                            }}>
                                <p style={{
                                    color: '#374151',
                                    fontSize: '14px',
                                    marginBottom: '4px'
                                }}>
                                    Paid Amount:
                                </p>
                                <p style={{
                                    color: '#10b981',
                                    fontSize: '18px',
                                    fontWeight: '600'
                                }}>
                                    £{paymentSuccessData.paidAmount}
                                </p>
                            </div>
                        )}
                        
                        {/* Reservation/Voucher ID removed per request */}
                        
                        {/* Close Button */}
                        <button
                            onClick={closePaymentSuccess}
                            style={{
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
            
            {/* Mobile-specific CSS for better responsive design */}
            <style>{`
                .mobile-optimized {
                    padding: 0 8px;
                }
                
                @media (max-width: 768px) {
                    .mobile-optimized .accodien > div {
                        margin-bottom: 10px !important;
                    }
                    
                    .mobile-optimized h3 {
                        margin-top: 5px !important;
                        margin-bottom: 10px !important;
                    }
                }
                
                @media (max-width: 576px) {
                    .mobile-optimized {
                        padding: 0 6px;
                    }
                    
                    .mobile-optimized .accodien > div {
                        margin-bottom: 8px !important;
                    }
                    
                    .mobile-optimized h3 {
                        margin-top: 3px !important;
                        margin-bottom: 8px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .mobile-optimized {
                        padding: 0 4px;
                    }
                    
                    .mobile-optimized .accodien > div {
                        margin-bottom: 6px !important;
                    }
                    
                    .mobile-optimized h3 {
                        margin-top: 2px !important;
                        margin-bottom: 6px !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default Index;
