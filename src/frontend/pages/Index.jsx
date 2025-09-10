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
    
    // Notification states for accordion completion
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    
    // Flag to track if we're in a fresh start after activity change
    const [isFreshStart, setIsFreshStart] = useState(false);

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
    
    
    
    // Close payment success popup and redirect to main website
    const closePaymentSuccess = () => {
        setShowPaymentSuccess(false);
        setPaymentSuccessData(null);
        // Redirect to main website
        window.location.href = 'https://flyawayballooning.com/';
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

    // Passenger Terms (for Passenger Information) modal state
    const [passengerTermsModalOpen, setPassengerTermsModalOpen] = React.useState(false);
    const [passengerTermsContent, setPassengerTermsContent] = React.useState('');
    const [passengerTermsShownForJourney, setPassengerTermsShownForJourney] = React.useState('');

    // Map local activity labels to admin journey labels
    const mapJourneyLabel = (label) => {
        if (!label) return '';
        switch (label) {
            case 'Book Flight Date':
                return 'Book Flight';
            case 'Buy Flight Voucher':
                return 'Flight Voucher';
            case 'Buy Gift Voucher':
                return 'Buy Gift';
            default:
                return label; // 'Redeem Voucher' stays same
        }
    };

    const fetchPassengerTermsForJourney = async (journeyLabelRaw) => {
        try {
            const journeyLabel = mapJourneyLabel(journeyLabelRaw);
            if (!journeyLabel) return;
            // Always fetch on completion so the popup appears right when all fields are valid
            const url = `${API_BASE_URL}/api/passenger-terms/journey/${encodeURIComponent(journeyLabel)}`;
            console.log('🔎 Fetching Passenger Terms for journey:', journeyLabel, 'URL:', url);
            let combined = '';
            try {
                const resp = await axios.get(url);
                if (resp?.data?.success && Array.isArray(resp.data.data) && resp.data.data.length > 0) {
                    combined = resp.data.data
                        .map((t) => (t && t.content ? String(t.content) : ''))
                        .filter(Boolean)
                        .join('\n\n');
                }
            } catch (e) {
                console.warn('Passenger terms journey endpoint failed, will try fallback', e);
            }

            // Fallback: fetch all and filter on client
            if (!combined) {
                try {
                    const allUrl = `${API_BASE_URL}/api/passenger-terms`;
                    console.log('🔎 Fallback fetching all Passenger Terms:', allUrl);
                    const respAll = await axios.get(allUrl);
                    if (respAll?.data?.success && Array.isArray(respAll.data.data)) {
                        const safeParse = (val) => {
                            try {
                                if (Array.isArray(val)) return val;
                                if (typeof val === 'string') {
                                    const s = val.trim();
                                    if (s.startsWith('[')) return JSON.parse(s);
                                    if (s.includes(',')) return s.split(',').map(v => v.trim());
                                    return s ? [s] : [];
                                }
                            } catch {}
                            return [];
                        };
                        const matched = respAll.data.data.filter((t) => safeParse(t.journey_types).includes(journeyLabel));
                        combined = matched
                            .map((t) => (t && t.content ? String(t.content) : ''))
                            .filter(Boolean)
                            .join('\n\n');
                    }
                } catch (e) {
                    console.warn('Passenger terms all endpoint failed', e);
                }
            }

            if (combined) {
                setPassengerTermsContent(combined);
                setPassengerTermsModalOpen(true);
                setPassengerTermsShownForJourney(journeyLabel);
            } else {
                console.log('ℹ️ No passenger terms content to show for', journeyLabel);
            }
        } catch (e) {
            console.error('Error fetching passenger terms:', e);
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

    // Get dynamic section sequence directly from summary panel logic (mirrors RightInfoCard.jsx mobileSections)
    // Takes current state as parameters to avoid stale closure issues
    const getSectionSequence = (activityType, currentLocation, currentPassengerData, currentAdditionalInfo, currentRecipientDetails) => {
        const baseSequence = ['activity'];
        
        // Helper functions (mirrored from RightInfoCard.jsx)
        const isAdditionalInfoValid = (info) => {
            if (!info || typeof info !== 'object') return false;
            const hasFilledValue = Object.values(info).some(val => {
                if (typeof val === 'string') {
                    const trimmed = val.trim();
                    return trimmed !== '';
                }
                if (typeof val === 'object' && val !== null) {
                    return Object.values(val).some(
                        v => typeof v === 'string' ? v.trim() !== '' : !!v
                    );
                }
                return !!val;
            });
            return hasFilledValue;
        };
        
        const isRecipientDetailsValid = (details) => {
            return !!(details && details.name && details.name.trim() !== '' && 
                     details.email && details.email.trim() !== '' && 
                     details.phone && details.phone.trim() !== '' && 
                     details.date && details.date.trim() !== '');
        };
        
        const isPassengerInfoComplete = Array.isArray(currentPassengerData) && currentPassengerData.every((passenger, index) => {
            const isFirstPassenger = index === 0;
            const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
                   passenger.lastName && passenger.lastName.trim() !== '' &&
                   (passenger.weight && (typeof passenger.weight === 'string' ? passenger.weight.trim() !== '' : passenger.weight !== null && passenger.weight !== undefined));
            const contactInfoValid = isFirstPassenger ? 
                (passenger.phone && passenger.phone.trim() !== '' && passenger.email && passenger.email.trim() !== '') : 
                true;
            return basicInfoValid && contactInfoValid;
        });
        
        const isBuyGiftPassengerComplete = Array.isArray(currentPassengerData) && currentPassengerData.every((passenger, index) => {
            const isFirstPassenger = index === 0;
            const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
                   passenger.lastName && passenger.lastName.trim() !== '';
            const contactInfoValid = isFirstPassenger ? 
                (passenger.phone && passenger.phone.trim() !== '' && passenger.email && passenger.email.trim() !== '') : 
                true;
            return basicInfoValid && contactInfoValid;
        });
        
        // Build sequence exactly like mobileSections in RightInfoCard.jsx
        if (activityType === 'Book Flight') {
            const sequence = [...baseSequence];
            sequence.push('location');
            sequence.push('experience');
            // Add voucher-type only if not Bristol Fiesta (mirrors RightInfoCard logic)
            if (currentLocation !== 'Bristol Fiesta') {
                sequence.push('voucher-type');
            }
            sequence.push('live-availability');
            sequence.push('passenger-info');
            sequence.push('additional-info');
            sequence.push('add-on');
            return sequence;
        }
        
        if (activityType === 'Redeem Voucher') {
            const sequence = [...baseSequence];
            sequence.push('location');
            sequence.push('live-availability');
            sequence.push('passenger-info');
            sequence.push('additional-info');
            sequence.push('add-on');
            return sequence;
        }
        
        if (activityType === 'Flight Voucher') {
            const sequence = [...baseSequence];
            sequence.push('experience');
            // Add voucher-type only if not Bristol Fiesta (mirrors RightInfoCard logic)
            if (currentLocation !== 'Bristol Fiesta') {
                sequence.push('voucher-type');
            }
            sequence.push('passenger-info');
            sequence.push('additional-info');
            sequence.push('add-on');
            return sequence;
        }
        
        if (activityType === 'Buy Gift') {
            const sequence = [...baseSequence];
            sequence.push('experience');
            // Add voucher-type only if not Bristol Fiesta (mirrors RightInfoCard logic)
            if (currentLocation !== 'Bristol Fiesta') {
                sequence.push('voucher-type');
            }
            sequence.push('passenger-info');
            sequence.push('recipient-details');
            sequence.push('add-on');
            return sequence;
        }
        
        return baseSequence;
    };

    // Auto-accordion logic: close current section and open next one based on summary panel sequence
    const handleSectionCompletion = (completedSectionId) => {
        if (!activitySelect) {
            console.log('❌ handleSectionCompletion: No activitySelect');
            return;
        }
        
        // Pass current state values to avoid stale closure issues
        // Always use current state for sequence calculation
        const sequence = getSectionSequence(activitySelect, chooseLocation, passengerData, additionalInfo, recipientDetails);
        const currentIndex = sequence.indexOf(completedSectionId);
        
        console.log('🔄 DYNAMIC ACCORDION SEQUENCE (CURRENT STATE):', {
            completedSectionId,
            activitySelect,
            chooseLocation,
            passengerDataLength: passengerData?.length,
            additionalInfo: additionalInfo,
            recipientDetails: recipientDetails,
            sequence,
            currentIndex,
            totalSections: sequence.length,
            nextSection: currentIndex + 1 < sequence.length ? sequence[currentIndex + 1] : 'NONE'
        });
        
        if (currentIndex === -1) {
            console.log('❌ Section not found in sequence:', completedSectionId);
            console.log('Available sections:', sequence);
            return;
        }
        
        // Show notification for completed section
        const sectionNames = {
            'activity': 'Activity Type',
            'location': 'Location',
            'experience': 'Experience',
            'voucher-type': 'Voucher Type',
            'live-availability': 'Live Availability',
            'passenger-info': 'Passenger Information',
            'additional-info': 'Additional Information',
            'recipient-details': 'Recipient Details',
            'add-on': 'Add To Booking'
        };
        
        const sectionName = sectionNames[completedSectionId] || completedSectionId;
        setNotificationMessage(`${sectionName} Selected`);
        setShowNotification(true);
        
        // Auto-hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
        
        // Trigger Passenger Terms popup when Passenger Information is completed
        if (completedSectionId === 'passenger-info') {
            const journeyLabel = activitySelect; // e.g., local labels
            fetchPassengerTermsForJourney(journeyLabel);
        }

        // Close current section
        setActiveAccordion(null);
        console.log('🔒 Closed current section:', completedSectionId);
        
        // Open next section after a short delay
        setTimeout(() => {
            // Fresh start durumunda sadece sequence'deki sırayı takip et
            let nextSection;
            
            if (isFreshStart) {
                // Fresh start: sadece sequence'deki sırayı takip et
                const currentIndex = sequence.indexOf(completedSectionId);
                nextSection = sequence[currentIndex + 1]; // Sıradaki section
                console.log('🔄 FRESH START: Following sequence order', {
                    completedSectionId,
                    currentIndex,
                    nextSection,
                    sequence
                });
                
                // Fresh start flag'ini sıfırla
                setIsFreshStart(false);
            } else {
                // Normal flow: check all current states
                const completedSections = [];
                if (activitySelect) completedSections.push('activity');
                if (chooseLocation) completedSections.push('location');
                if (chooseFlightType?.type) completedSections.push('experience');
                if (selectedVoucherType) completedSections.push('voucher-type');
                if (selectedDate && selectedTime) completedSections.push('live-availability');
                if (passengerData && passengerData.length > 0 && passengerData[0].firstName) completedSections.push('passenger-info');
                if (additionalInfo?.notes) completedSections.push('additional-info');
                if ((recipientDetails?.name && recipientDetails?.email && recipientDetails?.phone && recipientDetails?.date) || recipientDetails?.isSkipped) completedSections.push('recipient-details');
                if (chooseAddOn && chooseAddOn.length > 0) completedSections.push('add-on');
                
                // Tamamlanan section'ı da completed olarak işaretle
                if (!completedSections.includes(completedSectionId)) {
                    completedSections.push(completedSectionId);
                }
                
                console.log('📋 Completed sections after update:', completedSections);
                console.log('📋 Current sequence:', sequence);
                
                // Sıradaki tamamlanmamış section'ı bul
                nextSection = sequence.find(section => !completedSections.includes(section));
            }
            
            if (nextSection) {
                console.log('🔓 Opening next section:', nextSection, `(${sequence.indexOf(nextSection) + 1}/${sequence.length})`);
                setActiveAccordion(nextSection);
            } else {
                console.log('✅ No more sections to open - sequence complete');
                console.log('📋 Final sequence was:', sequence);
            }
        }, 500); // 500ms delay for smooth transition
    };

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
                    
                    // Add voucher type filter if selected
                    if (selectedVoucherType && selectedVoucherType.title) {
                        params.append('voucherTypes', selectedVoucherType.title);
                    } else if (activitySelect === 'Book Flight') {
                        // For Book Flight, if no voucher type is selected, show all availabilities
                        console.log('Voucher Types filter not specified; showing all for Book Flight');
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

    // Sync passengerCount with Voucher Type quantity for Flight Voucher and Book Flight flows
    useEffect(() => {
        if (selectedVoucherType && selectedVoucherType.quantity && (activitySelect === 'Flight Voucher' || activitySelect === 'Book Flight')) {
            setChooseFlightType(prev => ({
                ...prev,
                passengerCount: String(selectedVoucherType.quantity)
            }));
        }
    }, [selectedVoucherType, activitySelect]);



    // Yeni: activitySelect değiştiğinde tüm booking state'lerini sıfırla
    React.useEffect(() => {
        if (activitySelect !== null) {
            // Tüm state'leri sıfırla
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
            setSelectedTime(null);
            setActivityId(null);
            setSelectedActivity([]);
            setAvailableSeats([]);
            setVoucherCode('');
            setVoucherStatus(null);
            setSelectedVoucherType(null);
            
            // Accordion'ı da sıfırla - yeni uçuş türü için sıfırdan başla
            setActiveAccordion(null);
            
            console.log('🔄 ACTIVITY CHANGED - RESETTING ALL STATES:', {
                activitySelect,
                timestamp: new Date().getTime()
            });
        }
    }, [activitySelect]);

    // Yeni: activitySelect değiştiğinde accordion'ı sıfırla ve otomatik olarak sıralamayı baştan başlat
    React.useEffect(() => {
        if (activitySelect !== null) {
            console.log('🔄 ACTIVITY CHANGED - RESETTING EVERYTHING:', activitySelect);
            
            // Fresh start flag'ini set et
            setIsFreshStart(true);
            
            // Accordion'ı sıfırla
            setActiveAccordion(null);
            
            // Kısa delay sonra sıfırdan sıralamayı başlat
            setTimeout(() => {
                // Yeni uçuş türü için sıralamayı al (state'ler sıfırlandığı için temiz sıralama)
                const sequence = getSectionSequence(activitySelect, null, [], {}, {});
                
                console.log('🔄 ACTIVITY SELECT CHANGED - AUTO STARTING FROM BEGINNING:', {
                    activitySelect,
                    sequence,
                    firstSection: sequence[0],
                    totalSections: sequence.length,
                    message: 'Starting fresh accordion flow',
                    isFreshStart: true
                });
                
                // İlk accordion'ı (activity'den sonraki) otomatik aç
                if (sequence.length > 1) {
                    const firstSectionAfterActivity = sequence[1]; // activity'den sonraki ilk section
                    console.log('🔓 Auto-opening first section for new activity:', firstSectionAfterActivity);
                    setActiveAccordion(firstSectionAfterActivity);
                }
            }, 300); // State reset'in tamamlanması için biraz daha uzun delay
        }
    }, [activitySelect]);

    // Yeni: Dinamik sıralama değiştiğinde accordion akışını kontrol et
    React.useEffect(() => {
        // Don't run this effect if recipient-details accordion is open and user is typing
        if (activeAccordion === 'recipient-details') {
            return;
        }
        
        if (activitySelect !== null && activeAccordion !== null) {
            // Mevcut state değerlerini kullanarak sıralamayı al
            const sequence = getSectionSequence(activitySelect, chooseLocation, passengerData, additionalInfo, recipientDetails);
            
            console.log('🔄 DYNAMIC SEQUENCE CHECK - CURRENT ACCORDION:', {
                activeAccordion,
                activitySelect,
                chooseLocation,
                sequence,
                isCurrentInSequence: sequence.includes(activeAccordion)
            });
            
            // Eğer mevcut açık accordion yeni sıralamada yoksa, sıradaki accordion'ı aç
            if (!sequence.includes(activeAccordion)) {
                console.log('❌ Current accordion not in new sequence, finding next valid accordion');
                
                // Tamamlanmış section'ları kontrol et
                const completedSections = [];
                if (activitySelect) completedSections.push('activity');
                if (chooseLocation) completedSections.push('location');
                if (chooseFlightType?.type) completedSections.push('experience');
                if (selectedVoucherType) completedSections.push('voucher-type');
                if (selectedDate && selectedTime) completedSections.push('live-availability');
                if (passengerData && passengerData.length > 0 && passengerData[0].firstName) completedSections.push('passenger-info');
                if (additionalInfo?.notes) completedSections.push('additional-info');
                if ((recipientDetails?.name && recipientDetails?.email && recipientDetails?.phone && recipientDetails?.date) || recipientDetails?.isSkipped) completedSections.push('recipient-details');
                if (chooseAddOn && chooseAddOn.length > 0) completedSections.push('add-on');
                
                // Sıradaki tamamlanmamış section'ı bul
                const nextSection = sequence.find(section => !completedSections.includes(section));
                
                if (nextSection) {
                    console.log('🔓 Opening next valid section:', nextSection);
                    setActiveAccordion(nextSection);
                } else {
                    console.log('✅ All sections completed, closing accordion');
                    setActiveAccordion(null);
                }
            }
        }
    }, [chooseLocation, chooseFlightType, selectedVoucherType, selectedDate, selectedTime, passengerData, additionalInfo, recipientDetails, chooseAddOn]);

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
        <>
            {passengerTermsModalOpen && (
                <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:3000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:720,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                        <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:12}}>
                            <h4 style={{margin:0,fontSize:20,fontWeight:700,color:'#111827',textAlign:'center'}}>Important Information</h4>
                        </div>
                        <div style={{maxHeight:360,overflowY:'auto',whiteSpace:'pre-line',color:'#374151',lineHeight:1.6,fontSize:14,border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',background:'#f9fafb'}}>
                            {passengerTermsContent}
                        </div>
                        <div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
                            <button 
                                onClick={() => setPassengerTermsModalOpen(false)}
                                style={{background:'#10b981',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Notification for accordion completion */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    fontSize: '16px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'slideUp 0.3s ease-out',
                    maxWidth: '90vw',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '18px' }}>✓</span>
                    {notificationMessage}
                </div>
            )}
            
            <div className="final-booking-wrap" style={{ 
                overflowX: 'hidden', 
                maxWidth: '100vw', 
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative'
            }}>
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
                                        onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                                                    onSectionCompletion={handleSectionCompletion}
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
                        
                        {/* Customer Information - Hide for Flight Voucher and Buy Gift */}
                        {/* Only show customer info if: customerName exists AND activity is not Flight Voucher/Buy Gift AND payment type is not voucher */}
                        {(() => {
                            const shouldShowCustomer = paymentSuccessData.customerName && 
                                                     activitySelect !== 'Flight Voucher' && 
                                                     activitySelect !== 'Buy Gift' && 
                                                     paymentSuccessData.type !== 'voucher';
                            
                            // Debug logging for customer info visibility
                            console.log('🔍 Customer Info Visibility Check:', {
                                customerName: paymentSuccessData.customerName,
                                activitySelect,
                                paymentType: paymentSuccessData.type,
                                shouldShowCustomer
                            });
                            
                            return shouldShowCustomer;
                        })() && (
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
                    
                    /* Add spacing between accordions and summary on mobile */
                    .booking_data {
                        padding-bottom: 80px !important;
                    }
                    
                    .accodien {
                        margin-bottom: 20px !important;
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
                    
                    /* Add spacing between accordions and summary on mobile */
                    .booking_data {
                        padding-bottom: 80px !important;
                    }
                    
                    .accodien {
                        margin-bottom: 20px !important;
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
                    
                    /* Add spacing between accordions and summary on mobile */
                    .booking_data {
                        padding-bottom: 80px !important;
                    }
                    
                    .accodien {
                        margin-bottom: 20px !important;
                    }
                }
                
                /* Notification animation */
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>
            </div>
        </>
    )
}

export default Index;
