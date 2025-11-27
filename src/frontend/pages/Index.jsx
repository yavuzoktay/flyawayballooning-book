import React, { useState, useEffect, useCallback } from "react";
import LOGO from '../../assets/images/FAB_Logo_DarkBlue.png';

import { Container, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Divider, Button } from "@mui/material";
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
import ProgressBar from "../components/Common/ProgressBar";
import axios from "axios";
import "../components/HomePage/RedeemVoucher.css";
import { BsInfoCircle } from "react-icons/bs";
import { useLocation, useParams } from 'react-router-dom';
import CustomerPortalHeader from "../components/CustomerPortal/CustomerPortalHeader";

import config from '../../config';
import { loadStripe } from '@stripe/stripe-js';

const API_BASE_URL = config.API_BASE_URL;
const stripePromise = loadStripe(config.STRIPE_PUBLIC_KEY);

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
    const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const [holdActive, setHoldActive] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalData, setSuccessModalData] = useState(null);
    
    // Removed global accordion completion notification to avoid duplicate toasts
    const [showWarning, setShowWarning] = useState(false);
    
    // Flag to track if we're in a fresh start after activity change
    const [isFreshStart, setIsFreshStart] = useState(false);

    // Progress bar state
    const [completedSections, setCompletedSections] = useState(new Set());

    // NEW: viewport helper for mobile-specific inline tweaks
    const [isMobile, setIsMobile] = useState(false);
    const [isCustomerPortal, setIsCustomerPortal] = useState(false);
    const [portalBookingData, setPortalBookingData] = useState(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState(null);
    const { token } = useParams();
    
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Customer Portal: Fetch booking data when token is present
    useEffect(() => {
        if (token) {
            setIsCustomerPortal(true);
            setPortalLoading(true);
            setPortalError(null);
            
            axios.get(`${API_BASE_URL}/api/customer-portal-booking/${token}`)
                .then(response => {
                    if (response.data.success) {
                        setPortalBookingData(response.data.data);
                    } else {
                        setPortalError(response.data.message || 'Failed to load booking data.');
                    }
                })
                .catch(err => {
                    console.error('Error fetching customer portal booking data:', err);
                    setPortalError('Error loading booking data. Please try again later.');
                })
                .finally(() => {
                    setPortalLoading(false);
                });
        } else {
            setIsCustomerPortal(false);
        }
    }, [token]);

    // Helper function to get or create session ID
    const getOrCreateSessionId = () => {
        const sessionKey = 'fab_user_session_id';
        let sessionId = localStorage.getItem(sessionKey);
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(sessionKey, sessionId);
        }
        return sessionId;
    };

    // Helper function to parse user agent
    const parseUserAgent = (userAgent) => {
        const ua = userAgent || navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        let deviceType = 'desktop';

        // Detect OS
        if (ua.match(/Windows/i)) os = 'Windows';
        else if (ua.match(/Mac/i)) os = 'macOS';
        else if (ua.match(/Linux/i)) os = 'Linux';
        else if (ua.match(/Android/i)) {
            os = 'Android';
            deviceType = 'mobile';
        }
        else if (ua.match(/iPhone|iPad|iPod/i)) {
            os = 'iPhone';
            deviceType = 'mobile';
        }

        // Detect Browser
        if (ua.match(/Chrome/i) && !ua.match(/Edg|OPR/i)) browser = 'Chrome';
        else if (ua.match(/Safari/i) && !ua.match(/Chrome/i)) browser = 'Safari';
        else if (ua.match(/Firefox/i)) browser = 'Firefox';
        else if (ua.match(/Edg/i)) browser = 'Edge';
        else if (ua.match(/OPR/i)) browser = 'Opera';

        // Get browser version if available
        const versionMatch = ua.match(/(?:Chrome|Safari|Firefox|Edg|OPR)\/(\d+)/i);
        const version = versionMatch ? versionMatch[1] : '';
        if (version) {
            browser = `${browser} ${version}`;
        }

        return { browser, os, deviceType };
    };

    // Helper function to collect user session data
    const collectUserSessionData = () => {
        const sessionId = getOrCreateSessionId();
        const { browser, os, deviceType } = parseUserAgent();
        const browserSize = `${window.innerWidth}x${window.innerHeight}`;
        const language = navigator.language || navigator.userLanguage;
        const referrer = document.referrer || '';
        const landingPage = window.location.href;

        return {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            browser: browser,
            browser_size: browserSize,
            language: language,
            operating_system: os,
            device_type: deviceType,
            referrer: referrer,
            landing_page: landingPage
        };
    };

    // Helper function for section titles
    const getSectionTitle = (id) => {
        const titles = {
            'activity': 'Flight Type',
            'location': 'Location',
            'experience': 'Experience',
            'voucher-type': 'Voucher Type',
            'live-availability': 'Live Availability',
            'passenger-info': 'Passenger Info',
            'additional-info': 'Additional Info',
            'add-on': 'Add To Booking',
            'recipient-details': 'Recipient Details'
        };
        return titles[id] || id;
    };

    // Define progress sections based on activity type
    const progressSections = activitySelect === 'Book Flight' 
        ? ['activity', 'location', 'experience', ...(chooseLocation !== 'Bristol Fiesta' ? ['voucher-type'] : []), 'live-availability', 'passenger-info', 'additional-info', 'add-on']
        : activitySelect === 'Flight Voucher' // Changed from 'Buy Flight Voucher' to 'Flight Voucher'
        ? ['activity', 'experience', 'voucher-type', 'passenger-info', 'additional-info', 'add-on']
        : activitySelect === 'Buy Gift'
        ? ['activity', 'experience', 'voucher-type', 'passenger-info', 'recipient-details', 'add-on']
        : activitySelect === 'Redeem Voucher'
        ? ['activity', 'location', 'live-availability', 'passenger-info', 'additional-info', 'add-on'] // Experience removed from progress bar for Redeem Voucher
        : [];

    // Start/maintain 5-minute countdown when a date and time are selected
    useEffect(() => {
        let intervalId;
        if (selectedDate && selectedTime) {
            // Initialize timer if not set
            setCountdownSeconds(prev => (prev === null || prev === undefined ? 300 : prev));
            intervalId = setInterval(() => {
                setCountdownSeconds(prev => {
                    if (prev === null || prev === undefined) return prev;
                    if (prev <= 1) {
                        clearInterval(intervalId);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            // Clear when selection is reset
            setCountdownSeconds(null);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [selectedDate, selectedTime]);

    // Hold availability when timer starts
    useEffect(() => {
        const holdAvailability = async () => {
            if (!selectedDate || !selectedTime || !activityId || !chooseFlightType?.passengerCount || holdActive) {
                return;
            }
            
            try {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                const seatsToHold = parseInt(chooseFlightType.passengerCount) || 1;
                console.log('🔒 Frontend hold request:', {
                    activity_id: activityId,
                    date: dateStr,
                    time: selectedTime,
                    seats: seatsToHold,
                    sessionId: sessionId,
                    chooseFlightType: chooseFlightType,
                    selectedVoucherType: selectedVoucherType
                });
                
                const response = await axios.post(`${API_BASE_URL}/api/holdAvailability`, {
                    activity_id: activityId,
                    date: dateStr,
                    time: selectedTime,
                    seats: seatsToHold,
                    sessionId: sessionId
                });
                
                if (response.data.success) {
                    console.log('🔒 Availability held for 5 minutes:', response.data);
                    setHoldActive(true);
                }
            } catch (error) {
                console.error('❌ Error holding availability:', error);
            }
        };
        
        // Hold when timer starts (countdown is 300)
        if (countdownSeconds === 300 && selectedDate && selectedTime) {
            holdAvailability();
        }
    }, [countdownSeconds, selectedDate, selectedTime, activityId, chooseFlightType, sessionId, holdActive]);

    // Reset all selections when timer reaches 0
    useEffect(() => {
        if (countdownSeconds === 0) {
            console.log('⏰ Timer expired - resetting all selections to initial state');
            
            // Release the hold
            if (holdActive) {
                axios.post(`${API_BASE_URL}/api/releaseHold`, {
                    sessionId: sessionId
                }).then(() => {
                    console.log('🔓 Hold released due to timer expiry');
                    setHoldActive(false);
                }).catch(error => {
                    console.error('❌ Error releasing hold:', error);
                });
            }
            
            // Reset all state to initial values
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
            setSelectedTime(null);
            setAvailabilities([]);
            setSelectedVoucherType(null);
            setActiveAccordion(null);
            setShowWarning(false);
            setIsFreshStart(false);
            
            // Reset countdown to null (will be restarted when user makes new selections)
            setCountdownSeconds(null);
            
            console.log('✅ All selections have been reset - returning to initial state');
        }
    }, [countdownSeconds, holdActive, sessionId]);

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
    
    // Timeout functionality removed
    
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
    const [passengerTermsContentCache, setPassengerTermsContentCache] = React.useState('');
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

    const fetchPassengerTermsForJourney = async (journeyLabelRaw, { openModal = true, preferCache = true } = {}) => {
        try {
            const journeyLabel = mapJourneyLabel(journeyLabelRaw);
            if (!journeyLabel) return;
            // If we already have cached content and preferCache, use it
            if (preferCache && passengerTermsContentCache) {
                if (openModal) {
                    setPassengerTermsContent(passengerTermsContentCache);
                    setPassengerTermsModalOpen(true);
                    setPassengerTermsShownForJourney(journeyLabel);
                }
                return;
            }
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
                // Always populate cache
                setPassengerTermsContentCache(combined);
                if (openModal) {
                    setPassengerTermsContent(combined);
                    setPassengerTermsModalOpen(true);
                    setPassengerTermsShownForJourney(journeyLabel);
                }
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
                // Check if voucher has expired
                const expiresDate = response.data.data.expires;
                if (expiresDate) {
                    const now = new Date();
                    const expires = new Date(expiresDate);
                    
                    // Reset time to start of day for accurate comparison
                    now.setHours(0, 0, 0, 0);
                    expires.setHours(0, 0, 0, 0);
                    
                    if (now > expires) {
                        // Voucher has expired
                        setVoucherStatus('invalid');
                        setVoucherData(null);
                        const expiresFormatted = expires.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                        alert(`This voucher has expired. The expiration date (${expiresFormatted}) has passed. Expired vouchers cannot be used for redemption.`);
                        return;
                    }
                }
                
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
                
                // Set chooseFlightType and selectedVoucherType from voucher data for Redeem Voucher
                if (activitySelect === 'Redeem Voucher' && response.data.data) {
                    const voucherInfo = response.data.data;
                    
                    // Resolve passenger count from voucher
                    const resolvedPassengerCount = parseInt(voucherInfo.numberOfPassengers, 10);
                    // Set flight type from voucher experience_type
                    if (voucherInfo.experience_type) {
                        setChooseFlightType({
                            type: voucherInfo.experience_type,
                            passengerCount: !Number.isNaN(resolvedPassengerCount) && resolvedPassengerCount > 0 
                                ? String(resolvedPassengerCount) 
                                : "1",
                            price: voucherInfo.final_amount || 0
                        });
                    }
                    
                    // Use numberOfPassengers if provided by backend to pre-fill Passenger Information
                    if (!Number.isNaN(resolvedPassengerCount) && resolvedPassengerCount > 0) {
                        // Ensure passengerData array has exact count
                        setPassengerData(prev => {
                            const base = Array.isArray(prev) ? [...prev] : [];
                            const target = resolvedPassengerCount;
                            // grow
                            while (base.length < target) {
                                base.push({ firstName: '', lastName: '', weight: '', phone: '', email: '', weatherRefund: false });
                            }
                            // shrink
                            if (base.length > target) base.length = target;
                            return base;
                        });
                    }

                    // Set voucher type from voucher data
                    if (voucherInfo.voucher_type) {
                        // Map voucher type to valid backend types
                        let mappedVoucherType = voucherInfo.voucher_type;
                        
                        // Ensure the voucher type matches backend validation
                        const validTypes = ['Weekday Morning', 'Flexible Weekday', 'Any Day Flight'];
                        if (!validTypes.includes(mappedVoucherType)) {
                            // Default to 'Any Day Flight' if the type doesn't match
                            mappedVoucherType = 'Any Day Flight';
                            console.warn('Voucher type not in valid list, defaulting to Any Day Flight:', voucherInfo.voucher_type);
                        }
                        
                        setSelectedVoucherType({
                            title: mappedVoucherType,
                            quantity: !Number.isNaN(resolvedPassengerCount) && resolvedPassengerCount > 0 ? resolvedPassengerCount : 1,
                            price: voucherInfo.final_amount || 0
                        });
                    }
                    
                    console.log('Set chooseFlightType and selectedVoucherType for Redeem Voucher:', {
                        chooseFlightType: {
                            type: voucherInfo.experience_type,
                            passengerCount: "1",
                            price: voucherInfo.final_amount || 0
                        },
                        selectedVoucherType: {
                            title: voucherInfo.voucher_type,
                            quantity: 1,
                            price: voucherInfo.final_amount || 0
                        }
                    });
                }
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
                    alert(`This voucher code can no longer be used: ${errorMessage}`);
                } else if (errorMessage.includes('expired')) {
                    alert(`This voucher code has expired: ${errorMessage}`);
                } else if (errorMessage.includes('not yet valid')) {
                    alert(`This voucher code is not yet valid: ${errorMessage}`);
                } else if (errorMessage.includes('inactive')) {
                    alert(`This voucher code is inactive: ${errorMessage}`);
                } else {
                    alert(`Voucher code error: ${errorMessage}`);
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

    // Bottom toast for activity selection feedback
    const [selectionToast, setSelectionToast] = useState({ visible: false, text: '' });
    useEffect(() => {
        if (activitySelect) {
            const text = `Next`;
            setSelectionToast({ visible: true, text });
            // Desktop: button stays visible until clicked, no auto-hide
            // Mobile: auto-hide after 3.5s
            if (isMobile) {
                const t = setTimeout(() => setSelectionToast({ visible: false, text: '' }), 3500);
                return () => clearTimeout(t);
            }
            // Desktop: no auto-hide, button stays until clicked
        } else {
            setSelectionToast({ visible: false, text: '' });
        }
    }, [activitySelect, isMobile]);

    // Hide the activity "Next" toast if the user manually scrolls
    useEffect(() => {
        if (!selectionToast.visible) return;
        const hideOnScroll = () => {
            setSelectionToast(prev => ({ ...prev, visible: false }));
        };
        const opts = { passive: true };
        window.addEventListener('wheel', hideOnScroll, opts);
        window.addEventListener('touchmove', hideOnScroll, opts);
        window.addEventListener('scroll', hideOnScroll, opts);
        return () => {
            window.removeEventListener('wheel', hideOnScroll, opts);
            window.removeEventListener('touchmove', hideOnScroll, opts);
            window.removeEventListener('scroll', hideOnScroll, opts);
        };
    }, [selectionToast.visible]);

    // Book button validation logic (copied from RightInfoCard)
    // Keep logic in sync with RightInfoCard: don't mark as complete unless answered or required satisfied
    const isAdditionalInfoValid = (info) => {
        if (!info || typeof info !== 'object') return false;
        const requiredKeys = Array.isArray(info.__requiredKeys) ? info.__requiredKeys : [];
        if (requiredKeys.length > 0) {
            return requiredKeys.every((k) => {
                const v = info[k];
                return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== false;
            });
        }
        const answerKeys = Object.keys(info).filter(k => k.startsWith('question_'));
        return answerKeys.some(k => {
            const v = info[k];
            return typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null && v !== false;
        });
    };

    const isRecipientDetailsValid = (details) => {
        if (!details || typeof details !== 'object') {
            console.log('❌ recipientDetails is null/undefined or not object:', details);
            return false;
        }
        
        // If user chose "Don't enter recipient details", treat as valid for Buy Gift flow
        if (details.isSkipped === true) {
            console.log('✅ Recipient details explicitly skipped – treating as valid');
            return true;
        }
        
        // Check each field individually with proper null/undefined checks
        const hasName = details.name && typeof details.name === 'string' && details.name.trim() !== '';
        const hasEmail = details.email && typeof details.email === 'string' && details.email.trim() !== '';
        const hasPhone = details.phone && typeof details.phone === 'string' && details.phone.trim() !== '';
        const hasDate = details.date && typeof details.date === 'string' && details.date.trim() !== '';
        
        // Email format validation
        let emailFormatValid = true;
        if (hasEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            emailFormatValid = emailRegex.test(details.email.trim());
        }
        
        // Date format validation
        let dateFormatValid = true;
        if (hasDate) {
            const dateValue = new Date(details.date);
            dateFormatValid = !isNaN(dateValue.getTime());
        }
        
        const isComplete = hasName && hasEmail && hasPhone && hasDate && emailFormatValid && dateFormatValid;
        
        console.log('🎁 recipientDetails validation (with skip support):', {
            details,
            hasName: { value: details.name, valid: hasName },
            hasEmail: { value: details.email, valid: hasEmail },
            hasPhone: { value: details.phone, valid: hasPhone },
            hasDate: { value: details.date, valid: hasDate },
            emailFormatValid,
            dateFormatValid,
            isComplete,
            note: 'All fields required unless user chose to skip recipient details'
        });
        
        return isComplete;
    };

    const isPassengerInfoComplete = Array.isArray(passengerData) && passengerData.every((passenger, index) => {
        const isFirstPassenger = index === 0;
        
        // All passengers need: firstName, lastName, weight
        const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
               passenger.lastName && passenger.lastName.trim() !== '' &&
               (passenger.weight && (typeof passenger.weight === 'string' ? passenger.weight.trim() !== '' : passenger.weight !== null && passenger.weight !== undefined));
        
        // Only first passenger needs: phone and email
        const contactInfoValid = isFirstPassenger ? 
            (passenger.phone && passenger.phone.trim() !== '' && passenger.email && passenger.email.trim() !== '') : 
            true;
        
        return basicInfoValid && contactInfoValid;
    });

    const isBuyGiftPassengerComplete = Array.isArray(passengerData) && passengerData.every((passenger, index) => {
        const isFirstPassenger = index === 0;
        
        // All passengers need: firstName, lastName (no weight for Buy Gift)
        const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
               passenger.lastName && passenger.lastName.trim() !== '';
        
        // Only first passenger needs: phone (email not required for Purchaser Information)
        const contactInfoValid = isFirstPassenger ? 
            (passenger.phone && passenger.phone.trim() !== '') : 
            true;
        
        return basicInfoValid && contactInfoValid;
    });

    const isBookDisabled = isRedeemVoucher
        ? !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedVoucherType &&
            selectedDate &&
            selectedTime &&
            isPassengerInfoComplete
            // additionalInfo is optional for Redeem Voucher
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
        : isFlightVoucher
        ? !(
            chooseFlightType &&
            selectedVoucherType &&
            isPassengerInfoComplete &&
            isAdditionalInfoValid(additionalInfo)
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
        )
        : isGiftVoucher
        ? !(
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isBuyGiftPassengerComplete &&
            // isAdditionalInfoValid(additionalInfo) - now optional for Buy Gift
            isRecipientDetailsValid(recipientDetails)
        )
        : !(
            activitySelect &&
            chooseLocation &&
            chooseFlightType &&
            selectedVoucherType &&
            // chooseAddOn artık opsiyonel - isNonEmptyArray(chooseAddOn) kaldırıldı
            isPassengerInfoComplete &&
            // Enforce Additional Information required fields dynamically
            isAdditionalInfoValid(additionalInfo) &&
            selectedDate &&
            selectedTime
        );

    // Debug: Log the book disabled status for Redeem Voucher
    if (isRedeemVoucher) {
        console.log('🔍 REDEEM VOUCHER BOOK DISABLED DEBUG:', {
            activitySelect,
            chooseLocation,
            chooseFlightType,
            selectedVoucherType,
            selectedDate,
            selectedTime,
            isPassengerInfoComplete,
            isBookDisabled,
            timestamp: new Date().toLocaleTimeString()
        });
    }

    // Debug logging for Buy Gift
    console.log('🔍 Activity Debug:', {
        activitySelect,
        isGiftVoucher,
        chooseFlightType: !!chooseFlightType,
        selectedVoucherType: !!selectedVoucherType,
        isBuyGiftPassengerComplete,
        isRecipientDetailsValid: isRecipientDetailsValid(recipientDetails),
        isBookDisabled
    });
    
    if (isGiftVoucher) {
        console.log('🎁 Buy Gift Debug - Index.jsx:', {
            chooseFlightType: !!chooseFlightType,
            selectedVoucherType: !!selectedVoucherType,
            isBuyGiftPassengerComplete,
            isRecipientDetailsValid: isRecipientDetailsValid(recipientDetails),
            isBookDisabled,
            passengerData,
            recipientDetails,
            // Detailed validation breakdown
            validationBreakdown: {
                condition1_chooseFlightType: !!chooseFlightType,
                condition2_selectedVoucherType: !!selectedVoucherType,
                condition3_isBuyGiftPassengerComplete: isBuyGiftPassengerComplete,
                condition4_isRecipientDetailsValid: isRecipientDetailsValid(recipientDetails),
                finalResult: !!(chooseFlightType && selectedVoucherType && isBuyGiftPassengerComplete && isRecipientDetailsValid(recipientDetails))
            }
        });
    }

    // Calculate total price (copied from RightInfoCard)
    let totalPrice = 0;
    
    if (activitySelect === 'Book Flight') {
        // For Book Flight, only include voucher type price and add-ons
        const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
        const voucherTypePrice = (() => {
            if (!selectedVoucherType) return 0;
            if (isPrivateCharter) return selectedVoucherType?.totalPrice ?? selectedVoucherType?.price ?? 0;
            if (selectedVoucherType?.priceUnit === 'total') return selectedVoucherType?.price ?? 0;
            const basePrice = selectedVoucherType?.basePrice ?? selectedVoucherType?.price ?? 0;
            const quantity = selectedVoucherType?.quantity ?? 1;
            return basePrice * quantity;
        })();
        const addOnPrice = chooseAddOn?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0;
        // Weather refundable: 10% one-time for Private Charter, else £47.50 per selected passenger
        const weatherRefundPrice = isPrivateCharter
            ? (privateCharterWeatherRefund ? (voucherTypePrice * 0.1) : 0)
            : (Array.isArray(passengerData) ? passengerData.reduce((sum, p) => sum + (p && p.weatherRefund ? 47.50 : 0), 0) : 0);
        totalPrice = parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    } else if (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') {
        // For Flight Voucher and Buy Gift, only show total when voucher type is selected
        if (selectedVoucherType) {
            const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
            // Match RightInfoCard logic: total vs per-person pricing
            const voucherTypePrice = (() => {
                if (isPrivateCharter) return selectedVoucherType?.totalPrice ?? selectedVoucherType?.price ?? 0;
                if (selectedVoucherType?.priceUnit === 'total') return selectedVoucherType?.price ?? 0;
                const basePrice = selectedVoucherType?.basePrice ?? selectedVoucherType?.price ?? 0;
                const quantity = selectedVoucherType?.quantity ?? 1;
                return basePrice * quantity;
            })();
            const addOnPrice = chooseAddOn?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0;
            const weatherRefundPrice = isPrivateCharter
                ? (privateCharterWeatherRefund ? (voucherTypePrice * 0.1) : 0)
                : (Array.isArray(passengerData) ? passengerData.reduce((sum, p) => sum + (p && p.weatherRefund ? 47.50 : 0), 0) : 0);
            totalPrice = parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
        }
    } else {
        // For other activity types (like Redeem Voucher), include all components
        const flightTypePrice = chooseFlightType?.price || 0;
        const voucherTypePrice = (() => {
            if (!selectedVoucherType) return 0;
            const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
            if (isPrivateCharter) return selectedVoucherType?.totalPrice ?? selectedVoucherType?.price ?? 0;
            if (selectedVoucherType?.priceUnit === 'total') return selectedVoucherType?.price ?? 0;
            const basePrice = selectedVoucherType?.basePrice ?? selectedVoucherType?.price ?? 0;
            const quantity = selectedVoucherType?.quantity ?? 1;
            return basePrice * quantity;
        })();
        const addOnPrice = chooseAddOn?.reduce((sum, addon) => sum + (addon.price || 0), 0) || 0;
        const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
        const weatherRefundPrice = isPrivateCharter
            ? (privateCharterWeatherRefund ? (voucherTypePrice * 0.1) : 0)
            : (Array.isArray(passengerData) ? passengerData.reduce((sum, p) => sum + (p && p.weatherRefund ? 47.50 : 0), 0) : 0);
        totalPrice = parseFloat(flightTypePrice) + parseFloat(voucherTypePrice) + parseFloat(addOnPrice) + weatherRefundPrice;
    }

    // Validation function for Buy Gift fields
    const validateBuyGiftFields = () => {
        if (!isGiftVoucher) return true;
        
        // Check if all required fields are filled
        const hasRecipientDetails = isRecipientDetailsValid(recipientDetails);
        const hasPassengerInfo = isBuyGiftPassengerComplete;
        
        if (!hasRecipientDetails) {
            alert('Please fill in all recipient details.');
            return false;
        }
        
        if (!hasPassengerInfo) {
            alert('Please fill in all purchaser information.');
            return false;
        }
        
        return true;
    };

    // Lokasyon ve tarih seçilip seçilmediğini kontrol et
    const showBookingHeader = chooseLocation && selectedDate && selectedTime;

    // Get dynamic section sequence directly from summary panel logic (mirrors RightInfoCard.jsx mobileSections)
    // Takes current state as parameters to avoid stale closure issues
    const getSectionSequence = (activityType, currentLocation, currentPassengerData, currentAdditionalInfo, currentRecipientDetails) => {
        const baseSequence = ['activity'];
        
        // Helper functions (mirrored from RightInfoCard.jsx)
        
        
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
            // All passengers need: firstName, lastName (no weight for Buy Gift)
            const basicInfoValid = passenger.firstName && passenger.firstName.trim() !== '' &&
                   passenger.lastName && passenger.lastName.trim() !== '';
            // Only first passenger needs: phone and email
            const contactInfoValid = isFirstPassenger ? 
                (passenger.phone && passenger.phone.trim() !== '' && passenger.email && passenger.email.trim() !== '') : 
                true;
            return basicInfoValid && contactInfoValid;
        });
        
        // Build sequence exactly like mobileSections in RightInfoCard.jsx
        if (activityType === 'Book Flight') {
            const sequence = [...baseSequence];
            // Required order: Location → Experience → Voucher Type → Live Availability
            sequence.push('location');
            sequence.push('experience');
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
            sequence.push('experience');
            sequence.push('live-availability');
            sequence.push('passenger-info');
            sequence.push('additional-info');
            sequence.push('add-on');
            return sequence;
        }
        
        if (activityType === 'Flight Voucher') {
            const sequence = [...baseSequence];
            sequence.push('experience');
                sequence.push('voucher-type');
            sequence.push('passenger-info');
            sequence.push('additional-info');
            sequence.push('add-on');
            return sequence;
        }
        
        if (activityType === 'Buy Gift') {
            const sequence = [...baseSequence];
            sequence.push('experience');
                sequence.push('voucher-type');
            sequence.push('passenger-info');
            sequence.push('recipient-details');
            sequence.push('add-on');
            return sequence;
        }
        
        return baseSequence;
    };

    // Helper function to get the next section ID after a given section
    const getNextSectionId = (currentSectionId) => {
        if (!activitySelect) return null;
        const sequence = getSectionSequence(activitySelect, chooseLocation, passengerData, additionalInfo, recipientDetails);
        const currentIndex = sequence.indexOf(currentSectionId);
        if (currentIndex === -1 || currentIndex === sequence.length - 1) return null;
        return sequence[currentIndex + 1];
    };

    // Auto-accordion logic: close current section and open next one based on summary panel sequence
    const handleSectionCompletion = (completedSectionId) => {
        if (!activitySelect) {
            console.log('❌ handleSectionCompletion: No activitySelect');
            return;
        }
        
        // Update progress bar state immediately
        setCompletedSections(prev => {
            const newSet = new Set([...prev, completedSectionId]);
            console.log(`✅ Progress bar updated: ${completedSectionId} added to completed sections`);
            console.log(`📊 Completed sections:`, Array.from(newSet));
            return newSet;
        });
        console.log(`Section completed: ${completedSectionId}`);
        
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
        
        // Do not show global toast here; each section shows its own selection toast
        
        // Trigger Passenger Terms popup when Passenger Information is completed
        // Show after a delay to avoid interrupting the flow immediately
        if (completedSectionId === 'passenger-info') {
            const journeyLabel = activitySelect; // e.g., local labels
            setTimeout(() => {
                fetchPassengerTermsForJourney(journeyLabel);
            }, 10000);
            
            // For all activity types (including Flight Voucher), keep Passenger Information section open
            // This allows users to review and edit their information without the section auto-closing
            console.log('⏸ Keeping Passenger Information/Purchaser Information open; skipping auto-close/open');
            return;
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
                // For Redeem Voucher, experience is skipped in the flow, so don't check it for progress bar
                if (chooseFlightType?.type && activitySelect !== 'Redeem Voucher') {
                    completedSections.push('experience');
                }
                if (selectedVoucherType) completedSections.push('voucher-type');
                if (selectedDate && selectedTime) completedSections.push('live-availability');
                // Use proper passenger info validation based on activity type
                const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
                if (passengerComplete) completedSections.push('passenger-info');
                // Additional Information is optional unless API marks specific questions required
                if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');
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
            
            // Special handling for Redeem Voucher: Skip experience in the flow
            if (activitySelect === 'Redeem Voucher') {
                // After location: skip experience and go directly to live-availability
                if (completedSectionId === 'location' && nextSection === 'experience') {
                    const liveAvailabilityIndex = sequence.indexOf('live-availability');
                    if (liveAvailabilityIndex !== -1) {
                        nextSection = 'live-availability';
                        console.log('📅 Redeem Voucher: Skipping experience, opening live-availability directly');
                    }
                }
                // After live-availability: skip experience and go directly to passenger-info
                else if (completedSectionId === 'live-availability' && nextSection === 'experience') {
                    const passengerInfoIndex = sequence.indexOf('passenger-info');
                    if (passengerInfoIndex !== -1) {
                        nextSection = 'passenger-info';
                        console.log('📅 Redeem Voucher: Skipping experience, opening passenger-info directly after live-availability');
                    }
                }
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
        // Prefetch passenger terms when Passenger Information is opened so modal can show instantly
        if (sectionId === 'passenger-info') {
            fetchPassengerTermsForJourney(activitySelect, { openModal: false, preferCache: false });
        }
        setActiveAccordion(sectionId); // Aktivite seçildiyse normal davran
    };

    // Accordion'ların hangi sıraya göre enabled/disabled olacağını belirleyen fonksiyon
    const getAccordionState = (sectionId) => {
        // Eğer aktivite seçilmemişse sadece activity accordion'u enabled
        if (activitySelect === null) {
            return sectionId === 'activity' ? { isEnabled: true } : { isEnabled: false };
        }

        // Mevcut sequence'ı al
        const sequence = getSectionSequence(activitySelect, chooseLocation, passengerData, additionalInfo, recipientDetails);
        
        // Tamamlanmış section'ları belirle
        const completedSections = [];
        if (activitySelect) completedSections.push('activity');
        if (chooseLocation) completedSections.push('location');
        // For Redeem Voucher, experience is skipped in the flow, so don't check it for progress bar
        if (chooseFlightType?.type && activitySelect !== 'Redeem Voucher') {
            completedSections.push('experience');
        }
        if (selectedVoucherType) completedSections.push('voucher-type');
        if (selectedDate && selectedTime) completedSections.push('live-availability');
        // Use proper passenger info validation based on activity type
        const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
        if (passengerComplete) completedSections.push('passenger-info');
        // Additional Information is optional unless API marks specific questions required
        if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');
        if ((recipientDetails?.name && recipientDetails?.email && recipientDetails?.phone && recipientDetails?.date) || recipientDetails?.isSkipped) completedSections.push('recipient-details');
        if (chooseAddOn && chooseAddOn.length > 0) completedSections.push('add-on');

        // Section'ın sequence'daki pozisyonunu bul
        const sectionIndex = sequence.indexOf(sectionId);
        
        // Eğer section sequence'da yoksa disabled
        if (sectionIndex === -1) {
            return { isEnabled: false };
        }

        // İlk section (activity) her zaman enabled
        if (sectionIndex === 0) {
            return { isEnabled: true };
        }

        // Special handling for Redeem Voucher: Live Availability should remain enabled after selection
        // This allows users to change their date/time selection if needed
        if (sectionId === 'live-availability' && activitySelect === 'Redeem Voucher') {
            // For Redeem Voucher, Live Availability is enabled if location is selected
            // Even after date/time selection, it should remain enabled to allow changes
            if (chooseLocation) {
                return { isEnabled: true };
            }
        }

        // Special handling for Redeem Voucher: Additional Information should be enabled after Passenger Information is completed
        if (sectionId === 'additional-info' && activitySelect === 'Redeem Voucher') {
            // For Redeem Voucher, Additional Information is enabled if Passenger Information is completed
            // We skip experience in the flow, so we only check if passenger-info is completed
            if (passengerComplete) {
                return { isEnabled: true };
            }
        }

        // Önceki tüm section'lar tamamlanmış mı kontrol et
        const previousSections = sequence.slice(0, sectionIndex);
        // For Redeem Voucher, skip experience in the check since it's not part of the actual flow
        const sectionsToCheck = activitySelect === 'Redeem Voucher' 
            ? previousSections.filter(section => section !== 'experience')
            : previousSections;
        const allPreviousCompleted = sectionsToCheck.every(section => completedSections.includes(section));
        
        return { isEnabled: allPreviousCompleted };
    };

    // handleSetActiveAccordion fonksiyonunu güncelle - disabled accordion'lara tıklanmasını engelle
    const handleSetActiveAccordionWithValidation = (sectionId) => {
        if (activitySelect === null) {
            return; // Eğer aktivite seçilmediyse, hiçbir şey yapma
        }

        // Accordion'ın enabled olup olmadığını kontrol et
        const { isEnabled } = getAccordionState(sectionId);
        if (!isEnabled) {
            console.log('❌ Accordion disabled, cannot open:', sectionId);
            return;
        }

        // Prefetch passenger terms when Passenger Information is opened so modal can show instantly
        if (sectionId === 'passenger-info') {
            fetchPassengerTermsForJourney(activitySelect, { openModal: false, preferCache: false });
        }
        setActiveAccordion(sectionId); // Aktivite seçildiyse ve enabled ise normal davran
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
        setVoucherCode("");
        setShowWarning(false);
        setRecipientDetails({ name: "", email: "", phone: "", date: "" });
        setAdditionalInfo({ notes: "" });
        setSelectedDate(null);
        setActivityId(null);
        setSelectedActivity([]);
        setSelectedVoucherType(null);
        setAvailableSeats([]);
        setVoucherCode("");
        setVoucherStatus(null);
        setVoucherData(null);
    };

    // Send Data To Backend
    const handleBookData = async () => {
        console.log("Book button clicked");
        console.log("API_BASE_URL:", API_BASE_URL);

        const resolveVoucherPassengerCount = () => {
            const voucherQuantity = parseInt(selectedVoucherType?.quantity, 10);
            if (!Number.isNaN(voucherQuantity) && voucherQuantity > 0) return voucherQuantity;

            const chooseFlightCount = parseInt(chooseFlightType?.passengerCount, 10);
            if (!Number.isNaN(chooseFlightCount) && chooseFlightCount > 0) return chooseFlightCount;

            if (Array.isArray(passengerData) && passengerData.length > 0) {
                const filled = passengerData.filter(p => p && (p.firstName || p.lastName || p.email || p.phone)).length;
                return filled > 0 ? filled : passengerData.length;
            }

            return 1;
        };
        
        // Validate Buy Gift and Flight Voucher fields if needed
        if ((isGiftVoucher || isFlightVoucher) && validateBuyGiftFields) {
            const isValid = validateBuyGiftFields();
            if (!isValid) {
                return; // Validation failed, don't proceed
            }
        }
        if (isFlightVoucher || isGiftVoucher) {
            // Debug: Log the selectedVoucherType
            console.log('=== VOUCHER DATA PREPARATION DEBUG ===');
            console.log('selectedVoucherType:', selectedVoucherType);
            console.log('selectedVoucherType?.title:', selectedVoucherType?.title);
            console.log('isFlightVoucher:', isFlightVoucher);
            console.log('isGiftVoucher:', isGiftVoucher);
            
            // Validate that selectedVoucherType is set
            if (!selectedVoucherType || !selectedVoucherType.title) {
                alert('Please select a voucher type before proceeding with payment.');
                return;
            }
            
            // VOUCHER DATA PREPARATION (Flight Voucher ve Gift Voucher için Stripe ödeme)
            const voucherData = {
                // For Gift Vouchers: name/email/phone/mobile should be PURCHASER info (from PassengerInfo form)
                // For Flight Vouchers: name/email/phone/mobile should be the main contact info
                name: isGiftVoucher ? 
                    ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim() :
                    (recipientDetails?.name?.trim() || ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim()),
                weight: passengerData?.[0]?.weight || "",
                flight_type: chooseFlightType?.type || "",
                book_flight: isGiftVoucher ? "Gift Voucher" : "Flight Voucher", // Add book_flight field for backend detection
                voucher_type: isFlightVoucher ? "Flight Voucher" : "Gift Voucher",
                voucher_type_detail: selectedVoucherType?.title?.trim() || "", // Add the specific voucher type detail
                email: isGiftVoucher ? 
                    (passengerData?.[0]?.email || "").trim() :
                    (recipientDetails?.email || passengerData?.[0]?.email || "").trim(),
                phone: isGiftVoucher ? 
                    (passengerData?.[0]?.phone || "").trim() :
                    (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                mobile: isGiftVoucher ? 
                    (passengerData?.[0]?.phone || "").trim() :
                    (recipientDetails?.phone || passengerData?.[0]?.phone || "").trim(),
                redeemed: "No",
                paid: totalPrice, // This is already calculated correctly above
                offer_code: "",
                voucher_ref: voucherCode || "",
                // Recipient information (only for Gift Vouchers)
                recipient_name: isGiftVoucher ? (recipientDetails?.name || "") : "",
                recipient_email: isGiftVoucher ? (recipientDetails?.email || "") : "",
                recipient_phone: isGiftVoucher ? (recipientDetails?.phone || "") : "",
                recipient_gift_date: isGiftVoucher ? (recipientDetails?.date || "") : "",
                // Purchaser information (explicitly set for Gift Vouchers)
                purchaser_name: isGiftVoucher ? ((passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || '')).trim() : "",
                purchaser_email: isGiftVoucher ? (passengerData?.[0]?.email || "").trim() : "",
                purchaser_phone: isGiftVoucher ? (passengerData?.[0]?.phone || "").trim() : "",
                purchaser_mobile: isGiftVoucher ? (passengerData?.[0]?.phone || "").trim() : "",
                numberOfPassengers: resolveVoucherPassengerCount(),
                passengerData: passengerData, // Send the actual passenger data array
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
                additionalInfo: additionalInfo, // Add additional information data
                add_to_booking_items: chooseAddOn && chooseAddOn.length > 0 ? chooseAddOn : null, // Add add to booking items
                selectedVoucherType: selectedVoucherType // Include the full selectedVoucherType object for backend fallback
            };
            
            // Sending voucher data to backend
            console.log('chooseAddOn state:', chooseAddOn);
            console.log('chooseAddOn length:', chooseAddOn ? chooseAddOn.length : 'null/undefined');
            console.log('chooseAddOn is array:', Array.isArray(chooseAddOn));
            console.log('add_to_booking_items being sent:', voucherData.add_to_booking_items);
            
            // Log add-on selection state
            console.log('Add-on selection state:', {
                chooseAddOn,
                hasAddOns: !!(chooseAddOn && chooseAddOn.length > 0),
                addToBookingItems: voucherData.add_to_booking_items
            });
            
            // Test additional info endpoint
            try {
                const testResponse = await axios.post(`${API_BASE_URL}/api/testAdditionalInfo`, {
                    additionalInfo: additionalInfo
                });
                console.log('Test endpoint response:', testResponse.data);
            } catch (testError) {
                console.error('Test endpoint error:', testError);
            }
            
            console.log('=== NUMBER OF PASSENGERS DEBUG ===');
            console.log('passengerData:', passengerData);
            console.log('passengerData.length:', passengerData ? passengerData.length : 'passengerData is null/undefined');
            console.log('numberOfPassengers being sent:', voucherData.numberOfPassengers);
            
            try {
                // Collect user session data
                const userSessionData = collectUserSessionData();
                
                // Stripe Checkout Session başlat - VOUCHER için
                const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                    totalPrice,
                    currency: 'GBP',
                    voucherData,
                    type: 'voucher',
                    userSessionData: userSessionData
                });
                if (!sessionRes.data.success) {
                    alert('Payment could not be initiated: ' + (sessionRes.data.message || 'Unknown error'));
                    return;
                }
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({ sessionId: sessionRes.data.sessionId });
                if (error) {
                    alert('Stripe redirect error: ' + error.message);
                }
                // Başarılı ödeme sonrası voucher code generation ve createVoucher webhook ile tetiklenecek
            } catch (error) {
                console.error('Stripe Checkout başlatılırken hata:', error);
                const backendMsg = error?.response?.data?.message || error?.response?.data?.error?.message;
                const stripeMsg = error?.response?.data?.error?.type ? `${error.response.data.error.type}${error.response.data.error.code ? ' ('+error.response.data.error.code+')' : ''}` : '';
                const finalMsg = backendMsg || error?.message || 'Unknown error';
                alert(`An error occurred while starting payment. ${stripeMsg ? '['+stripeMsg+'] ' : ''}${finalMsg}`);
            }
            return;
        }
        
        // REDEEM VOUCHER FLOW (Stripe ödeme olmadan direkt createVoucher)
        if (isRedeemVoucher) {
            // Debug: Log the selectedVoucherType
            console.log('=== REDEEM VOUCHER DEBUG ===');
            console.log('selectedVoucherType:', selectedVoucherType);
            console.log('selectedVoucherType?.title:', selectedVoucherType?.title);
            
            // Validate that selectedVoucherType is set
            if (!selectedVoucherType || !selectedVoucherType.title) {
                alert('Please select a voucher type before proceeding.');
                return;
            }
            
            // Voucher data preparation for Redeem Voucher
            const voucherData = {
                name: (passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || ''),
                weight: passengerData?.[0]?.weight || "",
                flight_type: chooseFlightType?.type || "",
                voucher_type: "Redeem Voucher",
                voucher_type_detail: selectedVoucherType?.title?.trim() || "", // Add the specific voucher type detail
                email: passengerData?.[0]?.email || "",
                phone: passengerData?.[0]?.phone || "",
                mobile: passengerData?.[0]?.phone || "",
                redeemed: "Yes", // Redeem Voucher için redeemed = "Yes"
                paid: 0, // Redeem Voucher için ödeme yok
                offer_code: voucherCode || "",
                voucher_ref: voucherCode || "",
                recipient_name: "",
                recipient_email: "",
                recipient_phone: "",
                recipient_gift_date: "",
                // Purchaser information (same as main contact for Redeem Voucher)
                purchaser_name: (passengerData?.[0]?.firstName || '') + ' ' + (passengerData?.[0]?.lastName || ''),
                purchaser_email: passengerData?.[0]?.email || "",
                purchaser_phone: passengerData?.[0]?.phone || "",
                purchaser_mobile: passengerData?.[0]?.phone || "",
                numberOfPassengers: resolveVoucherPassengerCount(),
                passengerData: passengerData, // Send the actual passenger data array
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
                additionalInfo: additionalInfo, // Add additional information data
                add_to_booking_items: chooseAddOn && chooseAddOn.length > 0 ? chooseAddOn : null, // Add add to booking items
                selectedVoucherType: selectedVoucherType // Include the full selectedVoucherType object for backend fallback
            };
            
            // Sending redeem voucher data to backend
            console.log('=== REDEEM VOUCHER DEBUG ===');
            console.log('chooseAddOn state:', chooseAddOn);
            console.log('chooseAddOn length:', chooseAddOn ? chooseAddOn.length : 'null/undefined');
            console.log('add_to_booking_items being sent:', voucherData.add_to_booking_items);
            
            
            
            // Convert to booking data format for createBooking endpoint
            let bookingDateStr = selectedDate;
            if (selectedDate instanceof Date && selectedTime) {
                const [h, m, s] = selectedTime.split(":");
                const localDate = new Date(selectedDate);
                localDate.setHours(Number(h));
                localDate.setMinutes(Number(m));
                localDate.setSeconds(Number(s) || 0);
                bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
            } else if (selectedDate instanceof Date) {
                bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
            }
            
            const bookingData = {
                activitySelect: "Redeem Voucher",
                chooseLocation,
                chooseFlightType,
                selectedVoucherType,
                chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [],
                passengerData,
                additionalInfo,
                recipientDetails: null,
                selectedDate: bookingDateStr,
                selectedTime: selectedTime || null,
                totalPrice: 0, // Redeem voucher is free
                voucher_code: voucherCode,
                flight_attempts: 0,
                preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
                preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
                preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
                selectedVoucherType: selectedVoucherType ? {
                    id: selectedVoucherType.id || null,
                    title: selectedVoucherType.title,
                    quantity: selectedVoucherType.quantity,
                    totalPrice: selectedVoucherType.totalPrice || 0
                } : null,
                voucher_type: selectedVoucherType?.title || null,
                // Include privateCharterWeatherRefund for Private Charter bookings
                privateCharterWeatherRefund: chooseFlightType?.type === 'Private Charter' ? privateCharterWeatherRefund : false
            };

            try {
                // Collect user session data
                const userSessionData = collectUserSessionData();
                
                // Call simplified createRedeemBooking endpoint for Redeem Voucher
                const redeemBookingData = {
                    activitySelect,
                    chooseLocation,
                    chooseFlightType,
                    passengerData,
                    additionalInfo,
                    selectedDate: bookingDateStr,  // Use formatted date string, not raw Date object
                    selectedTime,
                    voucher_code: voucherCode,
                    totalPrice,
                    activity_id: activityId,
                    userSessionData: userSessionData
                };
                
                console.log('=== REDEEM BOOKING DATA (Index.jsx) ===');
                console.log('Redeem Booking Data:', redeemBookingData);
                
                const response = await axios.post(`${API_BASE_URL}/api/createRedeemBooking`, redeemBookingData);
                
                if (response.data.success) {
                    console.log('=== BOOKING CREATED SUCCESSFULLY (Index.jsx) ===');
                    console.log('Booking ID:', response.data.bookingId);
                    
                    // Mark the original voucher as redeemed
                    try {
                        console.log('=== MARKING VOUCHER AS REDEEMED (Index.jsx) ===');
                        console.log('Voucher Code:', voucherCode);
                        console.log('Booking ID:', response.data.bookingId);
                        
                        const redeemResponse = await axios.post(`${API_BASE_URL}/api/redeem-voucher`, {
                            voucher_code: voucherCode,
                            booking_id: response.data.bookingId
                        });
                        
                        console.log('=== REDEEM VOUCHER RESPONSE (Index.jsx) ===');
                        console.log('Success:', redeemResponse.data.success);
                        console.log('Message:', redeemResponse.data.message);
                        
                        // Show success modal with booking summary regardless of voucher marking result
                        setSuccessModalData({
                            bookingId: response.data.bookingId,
                            location: chooseLocation,
                            flightDate: bookingDateStr,
                            selectedTime: selectedTime,
                            passengers: passengerData,
                            voucherCode: voucherCode,
                            additionalInfo: additionalInfo,
                            addToBooking: chooseAddOn,
                            voucherMarkError: redeemResponse.data.success ? null : redeemResponse.data.message
                        });
                        setSuccessModalOpen(true);
                        
                        // Release the hold after successful booking
                        if (holdActive) {
                            try {
                                await axios.post(`${API_BASE_URL}/api/releaseHold`, {
                                    sessionId: sessionId
                                });
                                console.log('🔓 Hold released after successful booking');
                                setHoldActive(false);
                            } catch (error) {
                                console.error('❌ Error releasing hold:', error);
                            }
                        }
                    } catch (redeemError) {
                        console.error('=== REDEEM VOUCHER ERROR (Index.jsx) ===');
                        console.error('Error:', redeemError);
                        console.error('Response:', redeemError.response?.data);
                        
                        // Show success modal with booking summary even if voucher marking failed
                        setSuccessModalData({
                            bookingId: response.data.bookingId,
                            location: chooseLocation,
                            flightDate: bookingDateStr,
                            selectedTime: selectedTime,
                            passengers: passengerData,
                            voucherCode: voucherCode,
                            additionalInfo: additionalInfo,
                            addToBooking: chooseAddOn,
                            voucherMarkError: redeemError.response?.data?.message || redeemError.message
                        });
                        setSuccessModalOpen(true);
                        
                        // Release the hold even if there's an error
                        if (holdActive) {
                            try {
                                await axios.post(`${API_BASE_URL}/api/releaseHold`, {
                                    sessionId: sessionId
                                });
                                console.log('🔓 Hold released after booking (with error)');
                                setHoldActive(false);
                            } catch (error) {
                                console.error('❌ Error releasing hold:', error);
                            }
                        }
                    }
                    // Başarılı işlem sonrası form'u temizle
                    resetBooking();
                } else {
                    alert('An error occurred while creating the booking: ' + (response.data.error || response.data.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error while creating booking:', error);
                console.error('Error response:', error.response?.data);
                const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
                alert('An error occurred while creating the booking: ' + errorMessage);
            }
            return;
        }
        // BOOK FLIGHT FLOW (Stripe ile ödeme)
        let bookingDateStr = selectedDate;
        if (selectedDate instanceof Date && selectedTime) {
            const [h, m, s] = selectedTime.split(":");
            const localDate = new Date(selectedDate);
            localDate.setHours(Number(h));
            localDate.setMinutes(Number(m));
            localDate.setSeconds(Number(s) || 0);
            bookingDateStr = `${localDate.getFullYear()}-${String(localDate.getMonth()+1).padStart(2,'0')}-${String(localDate.getDate()).padStart(2,'0')} ${String(localDate.getHours()).padStart(2,'0')}:${String(localDate.getMinutes()).padStart(2,'0')}:${String(localDate.getSeconds()).padStart(2,'0')}`;
        } else if (selectedDate instanceof Date) {
            bookingDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
        }
        const bookingData = {
            activitySelect,
            chooseLocation,
            chooseFlightType,
            selectedVoucherType, // Add selectedVoucherType for voucher code generation
            chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [], // Opsiyonel - boş array olabilir
            passengerData,
            additionalInfo,
            recipientDetails,
            selectedDate: bookingDateStr,
            selectedTime: selectedTime || null,
            totalPrice,
            voucher_code: voucherCode,
            flight_attempts: chooseFlightType?.flight_attempts || 0,
            preferred_location: preference && preference.location ? Object.keys(preference.location).filter(k => preference.location[k]).join(', ') : null,
            preferred_time: preference && preference.time ? Object.keys(preference.time).filter(k => preference.time[k]).join(', ') : null,
            preferred_day: preference && preference.day ? Object.keys(preference.day).filter(k => preference.day[k]).join(', ') : null,
            activity_id: activityId
        };
        
        try {
            // Collect user session data
            const userSessionData = collectUserSessionData();
            
            // Stripe Checkout Session başlat - BOOKING için
            const sessionRes = await axios.post(`${API_BASE_URL}/api/create-checkout-session`, {
                totalPrice,
                currency: 'GBP',
                bookingData,
                type: 'booking',
                userSessionData: userSessionData
            });
            if (!sessionRes.data.success) {
                alert('Payment could not be initiated: ' + (sessionRes.data.message || 'Unknown error'));
                return;
            }
            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId: sessionRes.data.sessionId });
            if (error) {
                alert('Stripe redirect error: ' + error.message);
            }
            // Başarılı ödeme sonrası booking creation ve createBooking webhook ile tetiklenecek
        } catch (error) {
            console.error('Stripe Checkout başlatılırken hata:', error);
            const backendMsg = error?.response?.data?.message || error?.response?.data?.error?.message;
            const stripeMsg = error?.response?.data?.error?.type ? `${error.response.data.error.type}${error.response.data.error.code ? ' ('+error.response.data.error.code+')' : ''}` : '';
            const finalMsg = backendMsg || error?.message || 'Unknown error';
            alert(`An error occurred while starting payment. ${stripeMsg ? '['+stripeMsg+'] ' : ''}${finalMsg}`);
        }
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
                        params.append('flightType', flightTypeForBackend);
                    }
                    
                    // Add voucher type filter if selected
                    // For Redeem Voucher: use flight type to determine appropriate voucher types
                    if (activitySelect === 'Redeem Voucher' && chooseFlightType && chooseFlightType.type) {
                        // For Redeem Voucher, determine voucher types based on selected flight type
                        // not the voucher's original type
                        if (chooseFlightType.type === 'Private Charter') {
                            // For Private Charter, use private voucher types
                            // Try "Private Charter Flights" first, fallback to "Proposal Flight"
                            params.append('voucherTypes', 'Private Charter Flights');
                        } else if (chooseFlightType.type === 'Shared Flight') {
                            // For Shared Flight, use shared voucher types
                            // Use the voucher's original type if it's a shared type, otherwise default to "Any Day Flight"
                            const sharedVoucherTypes = ['Weekday Morning', 'Flexible Weekday', 'Any Day Flight'];
                            const voucherType = selectedVoucherType?.title;
                            if (voucherType && sharedVoucherTypes.includes(voucherType)) {
                                params.append('voucherTypes', voucherType);
                            } else {
                                params.append('voucherTypes', 'Any Day Flight');
                            }
                        }
                    } else if (selectedVoucherType && selectedVoucherType.title) {
                        // For other activity types, use the selected voucher type
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
            // Reset progress bar - mark only activity as completed
            setCompletedSections(new Set(['activity']));
            
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
        } else {
            // If no activity selected, clear everything including progress bar
            setCompletedSections(new Set());
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
                // Use proper passenger info validation based on activity type
                const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
                if (passengerComplete) completedSections.push('passenger-info');
                // Additional Information is optional unless API marks specific questions required
                if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');
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
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            setIsCustomerPortal(path.includes('customerportal'));
        }
    }, [location.pathname]);

    const scrollToPortalSection = useCallback((sectionId) => {
        if (typeof window === 'undefined') return;
        const element = document.getElementById(sectionId);
        if (!element) return;
        const offset = isMobile ? 80 : 140;
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, [isMobile]);

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
                        // Give the webhook a short window to populate the in-memory session store
                        // before we check the status or invoke the fallback
                        // Give webhooks a little more time on slower paths
                        await new Promise(r => setTimeout(r, 2000));
                        const statusResp = await axios.get(`${API_BASE_URL}/api/session-status`, { params: { session_id } });
                        if (statusResp.data?.processed) {
                            console.log('Session already processed on server, skipping fallback creation.');
                            localStorage.setItem(processedKey, '1');
                            return; // Avoid duplicate creation
                        }
                        // Try creating from session (fallback) with a short retry in case the webhook is still finalising
                        let response;
                        try {
                            response = await axios.post(`${API_BASE_URL}/api/createBookingFromSession`, { session_id, type });
                        } catch (e1) {
                            // If backend not ready yet, wait and retry once
                            await new Promise(r => setTimeout(r, 1500));
                            response = await axios.post(`${API_BASE_URL}/api/createBookingFromSession`, { session_id, type });
                        }
                        
                        // Mark as processed after server handles it
                        localStorage.setItem(processedKey, '1');
                        
                        if (response.data.success) {
                            // For Flight Vouchers, Buy Gift vouchers, and Book Flight, generate voucher code if not already generated
                            let finalVoucherCode = response.data.voucher_code;
                            
                            console.log('=== VOUCHER CODE DEBUG ===');
                            console.log('Type:', type);
                            console.log('Response data:', response.data);
                            console.log('Initial finalVoucherCode:', finalVoucherCode);
                            console.log('voucher_type:', response.data.voucher_type);
                            console.log('voucher_type_detail:', response.data.voucher_type_detail);
                            
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
                                    
                                    // For Book Flight, try to generate voucher code if backend didn't provide one
                                    if (type === 'booking' && response.data.voucher_type === 'Book Flight' && !finalVoucherCode) {
                                        console.log('Backend did not provide voucher code for Book Flight, trying to generate...');
                                        
                                        try {
                                            // Wait a bit for the booking to be fully created
                                            await new Promise(resolve => setTimeout(resolve, 2000));
                                            
                                            const voucherCodeResponse = await axios.post(`${API_BASE_URL}/api/generate-voucher-code`, {
                                                flight_category: flightCategory,
                                                customer_name: response.data.customer_name || 'Unknown Customer',
                                                customer_email: response.data.customer_email || '',
                                                location: 'Somerset', // Default location
                                                experience_type: 'Shared Flight', // Default experience
                                                voucher_type: 'Book Flight',
                                                paid_amount: response.data.paid_amount || 0,
                                                expires_date: null
                                            });
                                            
                                            if (voucherCodeResponse.data.success) {
                                                finalVoucherCode = voucherCodeResponse.data.voucher_code;
                                                console.log('Frontend generated Book Flight voucher code:', finalVoucherCode);
                                            } else {
                                                console.error('Failed to generate Book Flight voucher code on frontend:', voucherCodeResponse.data.message);
                                                // If still no voucher code, generate a simple one for display
                                                if (!finalVoucherCode) {
                                                    const timestamp = Date.now().toString().slice(-6);
                                                    finalVoucherCode = `BAT25${timestamp}`;
                                                    console.log('Generated fallback voucher code:', finalVoucherCode);
                                                }
                                            }
                                        } catch (frontendVoucherError) {
                                            console.error('Error generating Book Flight voucher code on frontend:', frontendVoucherError);
                                            // If still no voucher code, generate a simple one for display
                                            if (!finalVoucherCode) {
                                                const timestamp = Date.now().toString().slice(-6);
                                                finalVoucherCode = `BAT25${timestamp}`;
                                                console.log('Generated fallback voucher code after error:', finalVoucherCode);
                                            }
                                        }
                                    } else {
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
                                    }
                                } catch (voucherCodeError) {
                                    console.error('Error generating voucher code:', voucherCodeError);
                                    // Continue even if code generation fails
                                }
                            }
                            
                            console.log('=== FINAL VOUCHER CODE ASSIGNMENT ===');
                            console.log('finalVoucherCode before assignment:', finalVoucherCode);
                            console.log('Type:', type);
                            console.log('voucher_type:', response.data.voucher_type);
                            
                            // Set payment success data for popup
                            setPaymentSuccessData({
                                type: type,
                                id: response.data.id,
                                voucherCode: finalVoucherCode,
                                voucherCodes: response.data.voucher_codes || null, // Array of multiple voucher codes
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
                        // If the server returns 400 but the session becomes processed shortly after,
                        // poll the status endpoint before logging the error.
                        try {
                            for (let i = 0; i < 8; i++) {
                                const s = await axios.get(`${API_BASE_URL}/api/session-status`, { params: { session_id } });
                                if (s.data?.processed) {
                                    console.log('Session processed after fallback error; suppressing error.');
                                    localStorage.setItem(`fab_payment_processed_${session_id}`, '1');
                                    return;
                                }
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        } catch (statusCheckErr) {
                            // ignore
                        }
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
            alert('Payment cancelled.');
            // URL'den payment parametresini temizle
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [location, paymentProcessed]);

    // Customer Portal View
    if (isCustomerPortal) {
        if (portalLoading) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div>Loading customer portal...</div>
                </div>
            );
        }
        
        if (portalError) {
            return (
                <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                    <div>Error: {portalError}</div>
                </div>
            );
        }
        
        if (!portalBookingData) {
            return (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <div>No booking data found.</div>
                </div>
            );
        }
        
        return (
            <div className="customer-portal-page">
                <CustomerPortalHeader onNavigate={scrollToPortalSection} />
                <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 id="portal-main" style={{ textAlign: 'center', marginBottom: '30px' }}>Welcome to Your Customer Portal</h1>
                    
                    {/* Main Section Content */}
                    <section style={{ marginBottom: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h2>Your Booking Overview</h2>
                        <p>Here you can find all the details about your upcoming balloon flight.</p>
                        <p><strong>Booking Reference:</strong> {portalBookingData.booking_reference || portalBookingData.id}</p>
                        <p><strong>Flight Date:</strong> {portalBookingData.flight_date ? new Date(portalBookingData.flight_date).toLocaleString() : 'Not Scheduled'}</p>
                        <p><strong>Location:</strong> {portalBookingData.location || 'TBD'}</p>
                        <p><strong>Status:</strong> {portalBookingData.status || 'Open'}</p>
                    </section>
                    
                    {/* Booking Details Section */}
                    <section id="scroll-target-booking" style={{ marginBottom: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h2>Booking Details</h2>
                        <p><strong>Passengers:</strong> {portalBookingData.pax || 1}</p>
                        <p><strong>Experience:</strong> {portalBookingData.flight_type || portalBookingData.experience || 'N/A'}</p>
                        <p><strong>Name:</strong> {portalBookingData.name || 'N/A'}</p>
                        <p><strong>Email:</strong> {portalBookingData.email || 'N/A'}</p>
                        <p><strong>Phone:</strong> {portalBookingData.phone || 'N/A'}</p>
                        {portalBookingData.voucher_code && (
                            <p><strong>Voucher Code:</strong> {portalBookingData.voucher_code}</p>
                        )}
                        {portalBookingData.expires && (
                            <p><strong>Expires:</strong> {new Date(portalBookingData.expires).toLocaleDateString()}</p>
                        )}
                    </section>
                    
                    {/* Available Flights Section */}
                    <section id="live-availability" style={{ marginBottom: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h2>Available Flights</h2>
                        <p>Check for other available dates and times to reschedule your flight.</p>
                        <div style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center', color: '#888' }}>
                            Availability calendar will go here.
                        </div>
                    </section>
                    
                    {/* Information Section */}
                    <section id="additional-info" style={{ marginBottom: '40px', padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <h2>Important Information</h2>
                        <p>Please read the following before your flight:</p>
                        <ul>
                            <li>Weather dependent activity.</li>
                            <li>Arrive 30 minutes before scheduled flight.</li>
                            <li>Wear comfortable clothing.</li>
                        </ul>
                    </section>
                </div>
            </div>
        );
    }

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
                                style={{background:'#00eb5b',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}}
                            >
                                Agree and Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        {/* Bottom transient toast for activity selection */}
        {selectionToast.visible && (() => {
            // Find the next section after activity
            const sequence = getSectionSequence(activitySelect, chooseLocation, passengerData, additionalInfo, recipientDetails);
            const nextSectionId = sequence.length > 1 ? sequence[1] : null; // activity is at index 0, next is at index 1
            
            console.log('🔍 Next button render:', { 
                activitySelect, 
                sequence, 
                nextSectionId, 
                sequenceLength: sequence.length 
            });
            
            const handleNextClick = (e) => {
                if (!nextSectionId) return;
                // Hide the toast immediately
                setSelectionToast(prev => ({ ...prev, visible: false }));
                // Open the accordion
                setActiveAccordion(nextSectionId);

                // Helper to find the nearest scrollable parent of an element
                const getScrollableParent = (node) => {
                    let cur = node && node.parentElement;
                    while (cur && cur !== document.body && cur !== document.documentElement) {
                        const style = window.getComputedStyle(cur);
                        const oy = style.overflowY;
                        if ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight) {
                            return cur;
                        }
                        cur = cur.parentElement;
                    }
                    return window; // Fallback to window
                };

                // After accordion state updates, locate target and scroll its container
                requestAnimationFrame(() => {
                    // Resolve the target section element
                    let target = document.getElementById(nextSectionId) ||
                                 document.querySelector(`[data-accordion-id="${nextSectionId}"]`);
                    if (!target) {
                        const map = {
                            'location': 'Select Location',
                            'experience': 'Select Experience',
                            'voucher-type': 'Voucher Type',
                            'live-availability': 'Live Availability',
                            'passenger-info': 'Passenger Information',
                            'additional-info': 'Additional Information',
                            'recipient-details': 'Recipient Details',
                            'add-on': 'Add To Booking'
                        };
                        const label = map[nextSectionId];
                        if (label) {
                            const btn = Array.from(document.querySelectorAll('button.accordion'))
                                .find(el => (el.textContent || '').trim().includes(label));
                            if (btn) target = btn.closest('.accordion-section') || btn;
                        }
                    }

                    const scroller = getScrollableParent(target || (e && e.currentTarget));
                    const offset = isMobile ? 150 : 200; // Increased offset for more scroll distance

                    if (target) {
                        if (scroller === window) {
                            const rect = target.getBoundingClientRect();
                            const top = (window.pageYOffset || document.documentElement.scrollTop) + rect.top - offset;
                            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
                        } else {
                            const targetRect = target.getBoundingClientRect();
                            const scrollerRect = scroller.getBoundingClientRect();
                            const delta = targetRect.top - scrollerRect.top;
                            scroller.scrollTo({ top: scroller.scrollTop + delta - offset, behavior: 'smooth' });
                        }
                    } else {
                        // Fallback: small nudge down (desktop only)
                        if (!isMobile) {
                            window.scrollBy({ top: 200, behavior: 'smooth' }); // Increased fallback scroll
                        }
                    }
                });
            };
            
            return (
                <div style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    top: 'auto',
                    bottom: isMobile ? '80px' : '16px', // Increased spacing from summary on mobile
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 4000,
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        background: 'transparent',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        maxWidth: '92vw',
                        flexWrap: 'nowrap',
                        pointerEvents: 'auto'
                    }}>
                        <button
                            onClick={handleNextClick}
                            style={{
                                background: 'rgb(0, 235, 91)',
                                color: '#FFF',
                                padding: '10px 14px',
                                borderRadius: '12px',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                fontWeight: 700,
                                letterSpacing: '0.2px',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgb(0, 200, 75)';
                                e.target.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgb(0, 235, 91)';
                                e.target.style.transform = 'scale(1)';
                            }}
                        >Next</button>
                    </div>
                </div>
            );
        })()}
            {/* Global accordion completion toast removed */}
            
            {isCustomerPortal && (
                <CustomerPortalHeader onNavigate={scrollToPortalSection} />
            )}
            <div id="portal-main" style={{ scrollMarginTop: isMobile ? '90px' : '140px' }}></div>
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
                    {/* Progress Bar - sticky on desktop, fixed bottom on mobile */}
                    {activitySelect && (
                        <div style={{
                            position: isMobile ? 'fixed' : 'sticky',
                            top: isMobile ? 'auto' : '0',
                            bottom: isMobile ? '56px' : 'auto', // 80px to sit above the summary bar
                            left: isMobile ? '0' : 'auto',
                            right: isMobile ? '0' : 'auto',
                            zIndex: 1000,
                            padding: isMobile ? '12px 16px' : '16px 0', // Mobile: 16px horizontal padding to match Summary
                            marginBottom: isMobile ? '0' : '10px',
                            // Mobile: transparent background to match page, no shadow
                            backgroundColor: isMobile ? 'transparent' : 'transparent',
                            boxShadow: isMobile ? 'none' : 'none',
                            width: isMobile ? '100%' : 'auto',
                            maxWidth: isMobile ? 'none' : 'auto',
                            boxSizing: 'border-box'
                        }}>
                            <ProgressBar 
                                sections={progressSections.map(id => ({
                                    id,
                                    title: getSectionTitle(id),
                                    completed: completedSections.has(id)
                                }))}
                                activeSection={activeAccordion}
                                onCircleClick={(sectionId) => setActiveAccordion(sectionId)}
                                isMobile={isMobile}
                            />
                        </div>
                    )}

                    <div className="main_booking" id="portal-booking" style={{ scrollMarginTop: isMobile ? '90px' : '140px' }}>
                        <div className="booking_data">
                            <div className={`accodien ${isMobile ? 'mobile-optimized' : ''}`}>
                                {/* What would you like to do? Accordion */}
                                <div style={{ 
                                    marginBottom: isMobile ? '15px' : '30px',
                                    padding: isMobile ? '0 8px' : '0'
                                }}>
                                    <h3 style={{ 
                                        fontSize: isMobile ? '20px' : '20px', 
                                        textAlign: 'center', 
                                        marginBottom: isMobile ? '10px' : '20px',
                                        marginTop: isMobile ? '5px' : '0'
                                    }}>What would you like to do?</h3>
                                    {/* lightweight keyframes for bounce */}
                                    <style>{`
                                        @keyframes fabBounce {
                                            0%, 100% { transform: translateY(0); opacity: 0.9; }
                                            50% { transform: translateY(4px); opacity: 1; }
                                        }
                                    `}</style>
                                    <div id="scroll-target-booking" style={{ scrollMarginTop: isMobile ? '90px' : '140px' }} />
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
                                    {/* Down arrow button below the activity cards */}
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <button 
                                            type="button"
                                            aria-label="Scroll down"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const anchor = document.getElementById('scroll-target-booking');
                                                if (anchor && typeof anchor.scrollIntoView === 'function') {
                                                    anchor.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                                    return;
                                                }
                                                const getScrollableParent = (node) => {
                                                    let cur = node;
                                                    while (cur && cur !== document.body) {
                                                        const style = window.getComputedStyle(cur);
                                                        const oy = style.overflowY;
                                                        if ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight) {
                                                            return cur;
                                                        }
                                                        cur = cur.parentElement;
                                                    }
                                                    return window;
                                                };
                                                const scroller = getScrollableParent(e.currentTarget);
                                                const step = Math.round(scroller === window ? window.innerHeight : scroller.clientHeight);
                                                try {
                                                    if (scroller === window) { window.scrollBy({ top: step, left: 0, behavior: 'smooth' }); }
                                                    else { scroller.scrollBy({ top: step, left: 0, behavior: 'smooth' }); }
                                                } catch(err) {
                                                    if (scroller === window) { window.scrollTo(0, window.scrollY + step); }
                                                    else { scroller.scrollTop = (scroller.scrollTop || 0) + step; }
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const anchor = document.getElementById('scroll-target-booking');
                                                    if (anchor && typeof anchor.scrollIntoView === 'function') {
                                                        anchor.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                                                        return;
                                                    }
                                                    const getScrollableParent = (node) => {
                                                        let cur = node;
                                                        while (cur && cur !== document.body) {
                                                            const style = window.getComputedStyle(cur);
                                                            const oy = style.overflowY;
                                                            if ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight) {
                                                                return cur;
                                                            }
                                                            cur = cur.parentElement;
                                                        }
                                                        return window;
                                                    };
                                                    const scroller = getScrollableParent(e.currentTarget);
                                                    const step = Math.round(scroller === window ? window.innerHeight : scroller.clientHeight);
                                                    try {
                                                        if (scroller === window) { window.scrollBy({ top: step, left: 0, behavior: 'smooth' }); }
                                                        else { scroller.scrollBy({ top: step, left: 0, behavior: 'smooth' }); }
                                                    } catch(err) {
                                                        if (scroller === window) { window.scrollTo(0, window.scrollY + step); }
                                                        else { scroller.scrollTop = (scroller.scrollTop || 0) + step; }
                                                    }
                                                }
                                            }}
                                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', border: 'none', padding: isMobile ? 2 : 4, lineHeight: 0, position: 'relative', zIndex: 1000, pointerEvents: 'auto' }}
                                        >
                                            <svg width={isMobile ? 32 : 40} height={isMobile ? 32 : 40} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{
                                                animation: 'fabBounce 1.8s infinite',
                                                transformOrigin: '50% 50%'
                                            }}>
                                                <path d="M12 16.5l-6-6 1.41-1.41L12 13.67l4.59-4.58L18 10.5l-6 6z" fill="#4B5563"/>
                                            </svg>
                                        </button>
                                    </div>
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
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                setActivityId={setActivityId} 
                                                setSelectedActivity={setSelectedActivity}
                                                setAvailabilities={setAvailabilities}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('location').isEnabled}
                                            />
                                            <ExperienceSection 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                setChooseFlightType={setChooseFlightType} 
                                                addPassenger={addPassenger} 
                                                setAddPassenger={setAddPassenger} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                setAvailableSeats={setAvailableSeats}
                                                voucherCode={voucherCode}
                                                chooseLocation={chooseLocation}
                                                isFlightVoucher={isFlightVoucher}
                                                isBookFlight={isBookFlight}
                                                isGiftVoucher={isGiftVoucher}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('experience').isEnabled}
                                            />
                                            {chooseLocation !== "Bristol Fiesta" && (
                                                <VoucherType 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    passengerData={passengerData}
                                                    setPassengerData={setPassengerData}
                                                    privateCharterWeatherRefund={privateCharterWeatherRefund}
                                                    setPrivateCharterWeatherRefund={setPrivateCharterWeatherRefund}
                                                    isDisabled={!getAccordionState('voucher-type').isEnabled}
                                                />
                                            )}
                                            <LiveAvailabilitySection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                selectedDate={selectedDate} 
                                                setSelectedDate={setSelectedDate} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('live-availability').isEnabled}
                                            />
                                            <PassengerInfo
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
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
                                                isDisabled={!getAccordionState('passenger-info').isEnabled}
                                                getNextSectionId={getNextSectionId}
                                            />
                                            <AdditionalInfo 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isBookFlight={isBookFlight}
                                                additionalInfo={additionalInfo} 
                                                setAdditionalInfo={setAdditionalInfo} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
                                                flightType={chooseFlightType.type}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('additional-info').isEnabled}
                                            />
                                            
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                                disabled={false}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('add-on').isEnabled}
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
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                setActivityId={setActivityId} 
                                                setSelectedActivity={setSelectedActivity}
                                                setAvailabilities={setAvailabilities}
                                                selectedVoucherType={selectedVoucherType}
                                                chooseFlightType={chooseFlightType}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('location').isEnabled}
                                            />
                                            <LiveAvailabilitySection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                selectedDate={selectedDate} 
                                                setSelectedDate={setSelectedDate} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('live-availability').isEnabled}
                                            />
                                            <PassengerInfo
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
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
                                                isDisabled={!getAccordionState('passenger-info').isEnabled}
                                                getNextSectionId={getNextSectionId}
                                            />
                                            <AdditionalInfo 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                isBookFlight={isBookFlight}
                                                additionalInfo={additionalInfo} 
                                                setAdditionalInfo={setAdditionalInfo} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
                                                flightType={chooseFlightType.type}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('additional-info').isEnabled}
                                            />
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('add-on').isEnabled}
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
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                setAvailableSeats={setAvailableSeats}
                                                voucherCode={voucherCode}
                                                chooseLocation={chooseLocation}
                                                isFlightVoucher={isFlightVoucher}
                                                isBookFlight={isBookFlight}
                                                isGiftVoucher={isGiftVoucher}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('experience').isEnabled}
                                            />
                                            {chooseLocation !== "Bristol Fiesta" && (
                                                <VoucherType 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    isDisabled={!getAccordionState('voucher-type').isEnabled}
                                                />
                                            )}
                                            <PassengerInfo
                                                ref={passengerInfoRef}
                                                isGiftVoucher={isGiftVoucher}
                                                isFlightVoucher={isFlightVoucher}
                                                passengerData={passengerData}
                                                setPassengerData={setPassengerData}
                                                activeAccordion={activeAccordion}
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
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
                                                isDisabled={!getAccordionState('passenger-info').isEnabled}
                                                getNextSectionId={getNextSectionId}
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
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
                                                flightType={chooseFlightType.type}
                                                location={chooseLocation}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('additional-info').isEnabled}
                                            />
                                            {/* EnterPreferences removed for Flight Voucher */}
                                            <AddOnsSection 
                                                isGiftVoucher={isGiftVoucher} 
                                                isRedeemVoucher={isRedeemVoucher} 
                                                isFlightVoucher={isFlightVoucher} 
                                                chooseAddOn={chooseAddOn} 
                                                setChooseAddOn={setChooseAddOn} 
                                                activeAccordion={activeAccordion} 
                                                setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                chooseLocation={chooseLocation} 
                                                chooseFlightType={chooseFlightType} 
                                                activitySelect={activitySelect}
                                                flightType={chooseFlightType.type}
                                                onSectionCompletion={handleSectionCompletion}
                                                isDisabled={!getAccordionState('add-on').isEnabled}
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    isDisabled={!getAccordionState('voucher-type').isEnabled}
                                                />
                                            )}
                                            {!(activitySelect === "Flight Voucher" || activitySelect === "Redeem Voucher" || activitySelect === "Buy Gift") && (
                                                <LiveAvailabilitySection 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isFlightVoucher={isFlightVoucher} 
                                                    selectedDate={selectedDate} 
                                                    setSelectedDate={setSelectedDate} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
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
                                                setActiveAccordion={handleSetActiveAccordionWithValidation}
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
                                                isDisabled={!getAccordionState('passenger-info').isEnabled}
                                                getNextSectionId={getNextSectionId}
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation}
                                                    onSectionCompletion={handleSectionCompletion}
                                                    isDisabled={!getAccordionState('recipient-details').isEnabled}
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation} 
                                                    chooseLocation={chooseLocation} 
                                                    chooseFlightType={chooseFlightType} 
                                                    activitySelect={activitySelect}
                                                    flightType={chooseFlightType.type}
                                                    onSectionCompletion={handleSectionCompletion}
                                                    isDisabled={!getAccordionState('add-on').isEnabled}
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
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation}
                                                    flightType={chooseFlightType.type}
                                                    location={chooseLocation}
                                                    onSectionCompletion={handleSectionCompletion}
                                                    isDisabled={!getAccordionState('additional-info').isEnabled}
                                                />
                                            )}
                                            {(activitySelect === "Book Flight" || activitySelect === "Redeem Voucher") && (
                                                <EnterPreferences 
                                                    isGiftVoucher={isGiftVoucher} 
                                                    isRedeemVoucher={isRedeemVoucher} 
                                                    preference={preference} 
                                                    setPreference={setPreference} 
                                                    activeAccordion={activeAccordion} 
                                                    setActiveAccordion={handleSetActiveAccordionWithValidation}
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
                                activityId={activityId}
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
                            {/* Handle multiple voucher codes for Buy Gift Voucher */}
                            {(() => {
                                // Check if we have multiple voucher codes array
                                if (paymentSuccessData.voucherCodes && Array.isArray(paymentSuccessData.voucherCodes) && paymentSuccessData.voucherCodes.length > 1) {
                                    // Display multiple voucher codes from array
                                    return (
                                        <div>
                                            {paymentSuccessData.voucherCodes.map((code, index) => (
                                                <div key={index} style={{
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    fontSize: '20px',
                                                    fontWeight: '700',
                                                    padding: '10px 16px',
                                                    borderRadius: '8px',
                                                    letterSpacing: '2px',
                                                    fontFamily: 'monospace',
                                                    marginBottom: index < paymentSuccessData.voucherCodes.length - 1 ? '8px' : '0'
                                                }}>
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                } else {
                                    // Fallback to comma-separated string or single code
                                    const voucherCode = paymentSuccessData.voucherCode || 'Voucher Code Not Available';
                                    const isMultipleCodes = voucherCode.includes(',');
                                    
                                    if (isMultipleCodes) {
                                        // Split multiple codes and display each on a separate line
                                        const codes = voucherCode.split(',').map(code => code.trim());
                                        return (
                                            <div>
                                                {codes.map((code, index) => (
                                                    <div key={index} style={{
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        fontSize: '20px',
                                                        fontWeight: '700',
                                                        padding: '10px 16px',
                                                        borderRadius: '8px',
                                                        letterSpacing: '2px',
                                                        fontFamily: 'monospace',
                                                        marginBottom: index < codes.length - 1 ? '8px' : '0'
                                                    }}>
                                                        {code}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    } else {
                                        // Single voucher code (original logic)
                                        return (
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
                                                {voucherCode}
                                            </div>
                                        );
                                    }
                                }
                            })()}
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
            
            {/* Desktop Bottom Center Book Button - only show when all required fields complete */}
            {!isMobile && !isBookDisabled && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    <button
                        style={{
                            background: '#00eb5b',
                            color: '#fff',
                            fontWeight: 500,
                            borderRadius: '8px',
                            padding: '8px 22px',
                            cursor: 'pointer',
                            opacity: 1,
                            border: 'none',
                            fontSize: '17px'
                        }}
                        onClick={() => {
                            setShowWarning(false);
                            handleBookData();
                        }}
                        type="button"
                    >
                        Book
                    </button>
                </div>
            )}
            
            {/* Warning Display for Desktop Bottom Center Book Button */}
            {!isMobile && showWarning && (
                <div style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1001,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    <div style={{ color: 'red', fontSize: '14px' }}>
                        {activitySelect === 'Book Flight' && (
                            <>
                                Please complete all required fields:<br/>
                                • Flight Location and Experience<br/>
                                • Voucher Type<br/>
                                • Live Availability (Date & Time)<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Redeem Voucher' && (
                            <>
                                Please complete all required fields:<br/>
                                • Flight Location and Experience<br/>
                                • Live Availability (Date & Time)<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Flight Voucher' && (
                            <>
                                Please complete all required fields:<br/>
                                • Experience<br/>
                                • Passenger Information (All fields required)<br/>
                                • Additional Information<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect === 'Buy Gift' && (
                            <>
                                Please complete all required fields:<br/>
                                • Experience<br/>
                                • Voucher Type<br/>
                                • Recipient Details<br/>
                                • Purchaser Information (All fields required)<br/>
                                • Add to Booking
                            </>
                        )}
                        {activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher' && activitySelect !== 'Flight Voucher' && activitySelect !== 'Buy Gift' && (
                            'Please fill in all required steps before booking.'
                        )}
                    </div>
                </div>
            )}

            {/* Success Modal for Redeem Voucher */}
            <Dialog
                open={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 700, fontSize: 24, pb: 2, color: '#3274b4' }}>
                    {successModalData?.voucherMarkError ? '✓ Booking Created Successfully!' : '✓ Voucher Successfully Redeemed!'}
                </DialogTitle>
                <DialogContent>
                    {successModalData && (
                        <Box sx={{ py: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#3274b4' }}>
                                Booking Summary
                            </Typography>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Booking ID
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.bookingId}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Location
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.location || 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Live Availability
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {successModalData.flightDate 
                                        ? new Date(successModalData.flightDate).toLocaleDateString('en-GB', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) + (successModalData.selectedTime ? ` at ${successModalData.selectedTime}` : '')
                                        : 'N/A'}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    Voucher Code
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, color: '#3274b4' }}>
                                    {successModalData.voucherCode || 'N/A'}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                                    Passengers
                                </Typography>
                                {successModalData.passengers && successModalData.passengers.length > 0 ? (
                                    successModalData.passengers.map((passenger, index) => (
                                        <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                                            {index + 1}. {passenger.firstName} {passenger.lastName} 
                                            {passenger.weight ? ` (${passenger.weight}kg)` : ''}
                                            {passenger.weatherRefund ? ' - WX Refundable' : ''}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography variant="body1">No passengers</Typography>
                                )}
                            </Box>

                            {successModalData.additionalInfo && (successModalData.additionalInfo.notes || Object.keys(successModalData.additionalInfo).length > 0) && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Additional Information
                                        </Typography>
                                        {successModalData.additionalInfo.notes ? (
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {successModalData.additionalInfo.notes}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body1" color="text.secondary">
                                                No additional information provided
                                            </Typography>
                                        )}
                                    </Box>
                                </>
                            )}

                            {successModalData.addToBooking && successModalData.addToBooking.length > 0 && (
                                <>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                                            Add To Booking
                                        </Typography>
                                        {successModalData.addToBooking.map((item, index) => (
                                            <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>
                                                • {typeof item === 'object' ? item.title || item.name : item}
                                            </Typography>
                                        ))}
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'center' }}>
                    <Button
                        onClick={() => {
                            setSuccessModalOpen(false);
                            setSuccessModalData(null);
                        }}
                        variant="contained"
                        color="primary"
                        sx={{
                            minWidth: 120,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default Index;
