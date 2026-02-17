import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { trackPurchaseCompleted, captureGoogleAdsIds, getGoogleAdsIdsForCheckout } from '../../utils/googleAdsTracking';

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
    
    // Track Live Availability section loading state (from child component)
    const [isLiveAvailabilityLoading, setIsLiveAvailabilityLoading] = useState(false);
    
    // Use a ref to track loading state synchronously (bypasses React's async state batching)
    // This prevents race conditions when multiple handleSectionCompletion calls happen in quick succession
    const isLiveAvailabilityLoadingRef = useRef(false);
    const chooseFlightTypeRef = useRef(null);
    const selectedVoucherTypeRef = useRef(null);
    const chooseLocationRef = useRef(null);
    const availabilitiesRef = useRef([]);
    
    // Use a ref to track activityId synchronously for polling mechanism
    // This allows polling to read the latest activityId value without closure issues
    const activityIdRef = useRef(null);
    
    // Guard timer for delaying Live Availability open until state is ready
    const liveAvailabilityGuardTimerRef = useRef(null);
    const liveAvailabilityGuardStartRef = useRef(null);
    
    // Request cancellation token for aborting in-flight requests
    const availabilitiesRequestControllerRef = useRef(null);
    const availabilitiesDebounceTimerRef = useRef(null);
    const lastAvailabilitiesRequestRef = useRef(null);
    
    // Track current calendar month for incremental loading
    // Start with null - only set when user explicitly navigates calendar
    const [currentCalendarDate, setCurrentCalendarDate] = useState(null);
    
    // Track Terms and Conditions loading state from VoucherType component
    const [voucherTermsLoading, setVoucherTermsLoading] = useState(false);
    const voucherTermsLoadedRef = useRef(false);
    
    // Track Accordion loading states from VoucherType component
    const [accordionLoadingStates, setAccordionLoadingStates] = useState({
        allVoucherTypesLoading: true,
        privateCharterVoucherTypesLoading: true,
        activityDataLoading: false,
        isAccordionLoading: true
    });
    const accordionLoadedRef = useRef(false);
    
    // Reset terms loaded flag when voucher type changes
    useEffect(() => {
        if (selectedVoucherType) {
            voucherTermsLoadedRef.current = false;
        }
    }, [selectedVoucherType?.title]);
    
    // Reset accordion loaded flag when location or flight type changes
    useEffect(() => {
        accordionLoadedRef.current = false;
    }, [chooseLocation, chooseFlightType?.type]);
    
    // Track when all accordions finish loading
    useEffect(() => {
        const allLoaded = !accordionLoadingStates.isAccordionLoading && 
                         !accordionLoadingStates.allVoucherTypesLoading && 
                         !accordionLoadingStates.privateCharterVoucherTypesLoading &&
                         !accordionLoadingStates.activityDataLoading;
        
        if (allLoaded && !accordionLoadedRef.current) {
            console.log('[ShopifyDebug] All accordions finished loading', {
                allVoucherTypesLoading: accordionLoadingStates.allVoucherTypesLoading,
                privateCharterVoucherTypesLoading: accordionLoadingStates.privateCharterVoucherTypesLoading,
                activityDataLoading: accordionLoadingStates.activityDataLoading
            });
            // Set flag after a small delay to ensure network requests are complete
            setTimeout(() => {
                accordionLoadedRef.current = true;
                console.log('[ShopifyDebug] Accordion loaded flag set to true');
            }, 500);
        }
    }, [accordionLoadingStates]);
    
    // Keep activityIdRef in sync with activityId state
    useEffect(() => {
        activityIdRef.current = activityId;
    }, [activityId]);
    
    // Track latest flight type and voucher type synchronously for guard checks
    useEffect(() => {
        chooseFlightTypeRef.current = chooseFlightType;
    }, [chooseFlightType]);
    
    useEffect(() => {
        selectedVoucherTypeRef.current = selectedVoucherType;
    }, [selectedVoucherType]);
    
    useEffect(() => {
        chooseLocationRef.current = chooseLocation;
    }, [chooseLocation]);
    
    useEffect(() => {
        availabilitiesRef.current = availabilities;
    }, [availabilities]);
    
    // Cleanup guard timer on unmount
    useEffect(() => {
        return () => {
            if (liveAvailabilityGuardTimerRef.current) {
                clearTimeout(liveAvailabilityGuardTimerRef.current);
            }
        };
    }, []);
    
    // Wrapper to update both state and ref synchronously
    const setIsLiveAvailabilityLoadingSync = useCallback((value) => {
        isLiveAvailabilityLoadingRef.current = value; // Update ref synchronously
        setIsLiveAvailabilityLoading(value); // Update state asynchronously
    }, []);

    // Progress bar state
    const [completedSections, setCompletedSections] = useState(new Set());

    // NEW: viewport helper for mobile-specific inline tweaks
    const [isMobile, setIsMobile] = useState(false);
    const [isCustomerPortal, setIsCustomerPortal] = useState(false);
    const [portalBookingData, setPortalBookingData] = useState(null);
    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState(null);
    const { token } = useParams();
    
    const location = useLocation();
    const [shopifyStartAtVoucher, setShopifyStartAtVoucher] = useState(false);
    const shopifyVoucherForcedRef = useRef(false);
    const shopifyPrefillInProgress = useRef(false);
    const activityDeepLinkHandledRef = useRef(false);
    const googleMerchantClearHandledRef = useRef(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Capture Google Ads IDs on page load and when URL changes (e.g. landing with gbraid)
    useEffect(() => {
        captureGoogleAdsIds();
    }, [location?.search]);

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
        
        // Get Google Ads IDs (capture from URL if present, else use stored)
        const captured = captureGoogleAdsIds();
        const stored = getGoogleAdsIdsForCheckout();
        const googleAdsIds = {
            gclid: captured?.gclid ?? stored.gclid ?? null,
            wbraid: captured?.wbraid ?? stored.wbraid ?? null,
            gbraid: captured?.gbraid ?? stored.gbraid ?? null
        };

        return {
            session_id: sessionId,
            user_agent: navigator.userAgent,
            browser: browser,
            browser_size: browserSize,
            language: language,
            operating_system: os,
            device_type: deviceType,
            referrer: referrer,
            landing_page: landingPage,
            // Include Google Ads IDs for conversion tracking
            gclid: googleAdsIds.gclid,
            wbraid: googleAdsIds.wbraid,
            gbraid: googleAdsIds.gbraid
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
    // Returns a promise that resolves when availabilities are fetched
    // OPTIMIZED: Added request cancellation and debouncing to prevent duplicate requests
    const refetchAvailabilities = useCallback(async (skipDebounce = false) => {
        if (chooseLocation && activityId) {
            // Cancel any pending debounce timer
            if (availabilitiesDebounceTimerRef.current) {
                clearTimeout(availabilitiesDebounceTimerRef.current);
                availabilitiesDebounceTimerRef.current = null;
            }

            // Cancel any in-flight request ONLY if it's a different request
            // Don't cancel if it's the same request key (prevents cancelling our own request)
            const calendarKey = currentCalendarDate 
                ? `${currentCalendarDate.getFullYear()}-${currentCalendarDate.getMonth() + 1}` 
                : 'initial';
            const currentRequestKey = `${chooseLocation}_${activityId}_${selectedVoucherType?.title || 'none'}_${chooseFlightType?.type || 'none'}_${calendarKey}`;
            
            if (availabilitiesRequestControllerRef.current && lastAvailabilitiesRequestRef.current !== currentRequestKey) {
                availabilitiesRequestControllerRef.current.abort();
                availabilitiesRequestControllerRef.current = null;
            }

            // Create request key to detect duplicate requests (include calendar date)
            // Note: calendarKey already defined above for abort check
            const requestKey = currentRequestKey;
            
            // Skip if same request is already in progress (check even if skipDebounce is true to prevent duplicate calls)
            if (lastAvailabilitiesRequestRef.current === requestKey) {
                console.log('🔵 refetchAvailabilities - Skipping duplicate request:', requestKey);
                return [];
            }

            // Debounce requests (except when explicitly skipped)
            if (!skipDebounce) {
                return new Promise((resolve) => {
                    availabilitiesDebounceTimerRef.current = setTimeout(async () => {
                        const result = await refetchAvailabilities(true);
                        resolve(result);
                    }, 300); // 300ms debounce
                });
            }

            // Mark this request as in progress (only if different from current)
            if (lastAvailabilitiesRequestRef.current !== requestKey) {
                lastAvailabilitiesRequestRef.current = requestKey;
            }

            // Create new AbortController for this request
            const controller = new AbortController();
            availabilitiesRequestControllerRef.current = controller;

            try {
                const params = new URLSearchParams({
                    location: chooseLocation,
                    activityId: activityId
                });
                
                // Add voucher type filter if selected
                if (selectedVoucherType?.title) {
                    params.append('voucherTypes', selectedVoucherType.title);
                    console.log('🔵 refetchAvailabilities - Adding voucherTypes filter:', selectedVoucherType.title);
                } else {
                    console.log('🔵 refetchAvailabilities - No voucher type selected, not filtering by voucher type');
                }
                
                // Add flight type filter if selected - map UI values to backend values
                if (chooseFlightType?.type) {
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
                
                // OPTIMIZATION: Add date range for incremental loading
                // Only add date range if currentCalendarDate is explicitly set (user navigated calendar)
                // For initial load, don't send date range - let backend use default 60-day range
                if (currentCalendarDate) {
                    const year = currentCalendarDate.getFullYear();
                    const month = currentCalendarDate.getMonth() + 1; // 1-12 (1=Jan, 12=Dec)
                    const monthIndex = month - 1; // Convert to 0-indexed for Date constructor
                    
                    // Calculate start date: 1 month before the displayed month
                    const startMonthIndex = Math.max(0, monthIndex - 1); // At least current month, or 1 month before
                    const startDate = new Date(year, startMonthIndex, 1);
                    
                    // Calculate end date: 1 month after the displayed month (last day of next month)
                    const endDateCorrected = new Date(year, monthIndex + 2, 0); // Last day of next month
                    
                    // Format as YYYY-MM-DD
                    const formatDate = (d) => {
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                    };
                    
                    params.append('startDate', formatDate(startDate));
                    params.append('endDate', formatDate(endDateCorrected));
                    params.append('month', month);
                    params.append('year', year);
                    
                    console.log('🔵 refetchAvailabilities - Adding date range filter:', {
                        startDate: formatDate(startDate),
                        endDate: formatDate(endDateCorrected),
                        month,
                        year
                    });
                } else {
                    console.log('🔵 refetchAvailabilities - No date range filter, using backend default 60-day range');
                }
                // If currentCalendarDate is not set, don't add date range - backend will use default 60-day range
                
                // PRODUCTION DEBUG: Log API call details
                console.log('=== refetchAvailabilities DEBUG ===');
                console.log('API_BASE_URL:', API_BASE_URL);
                console.log('Params:', params.toString());
                console.log('Full URL:', `${API_BASE_URL}/api/availabilities/filter?${params.toString()}`);
                console.log('================================');
                
                const fetchStartTime = Date.now();
                const response = await axios.get(`${API_BASE_URL}/api/availabilities/filter?${params.toString()}`, {
                    signal: controller.signal
                });
                
                // Clear request controller if successful
                if (availabilitiesRequestControllerRef.current === controller) {
                    availabilitiesRequestControllerRef.current = null;
                }
                
                const fetchEndTime = Date.now();
                const fetchDuration = fetchEndTime - fetchStartTime;
                
                console.log('API Response:', response.data);
                console.log('Response success:', response.data.success);
                console.log('Response data length:', response.data.data?.length || 0);
                console.log('Fetch duration:', fetchDuration, 'ms');
                
                if (response.data.success) {
                    const availData = response.data.data || [];
                    
                    // OPTIMIZATION: Merge new data with existing availabilities instead of replacing
                    // This allows incremental loading where different months' data are combined
                    setAvailabilities(prevAvailabilities => {
                        if (!prevAvailabilities || prevAvailabilities.length === 0) {
                            return availData;
                        }
                        
                        // Create a map of existing availabilities by unique key (date + time + activity_id)
                        const existingMap = new Map();
                        prevAvailabilities.forEach(avail => {
                            const key = `${avail.date}_${avail.time}_${avail.activity_id}`;
                            existingMap.set(key, avail);
                        });
                        
                        // Merge new data, overwriting existing entries for the same date/time
                        availData.forEach(avail => {
                            const key = `${avail.date}_${avail.time}_${avail.activity_id}`;
                            existingMap.set(key, avail);
                        });
                        
                        // Convert back to array and sort by date, time
                        const merged = Array.from(existingMap.values()).sort((a, b) => {
                            const dateCompare = a.date.localeCompare(b.date);
                            if (dateCompare !== 0) return dateCompare;
                            return (a.time || '').localeCompare(b.time || '');
                        });
                        
                        console.log('🔵 Availabilities merged:', {
                            previousCount: prevAvailabilities.length,
                            newCount: availData.length,
                            mergedCount: merged.length
                        });
                        
                        return merged;
                    });
                    
                    console.log('Availabilities updated, new data count:', availData.length);
                    return availData; // Return the data so caller can wait for it
                } else {
                    console.log('API returned success: false');
                    console.log('Response error:', response.data.error || 'No error message');
                    return [];
                }
            } catch (error) {
                // Clear request controller on error
                if (availabilitiesRequestControllerRef.current === controller) {
                    availabilitiesRequestControllerRef.current = null;
                }

                // Ignore abort errors (request was cancelled)
                if (error.name === 'CanceledError' || error.name === 'AbortError' || axios.isCancel(error)) {
                    console.log('🔵 refetchAvailabilities - Request cancelled');
                    return [];
                }

                console.error('Error refetching availabilities:', error);
                console.error('Error details:', error.response?.data);
                return [];
            } finally {
                // Don't clear request key immediately - keep it for duplicate detection
                // Only clear if a new different request starts
                // This prevents rapid duplicate calls
            }
        } else {
            console.log('refetchAvailabilities skipped - missing chooseLocation or activityId');
            return [];
        }
    }, [chooseLocation, activityId, selectedVoucherType?.title, chooseFlightType?.type, currentCalendarDate]);
    
    // OPTIMIZATION: Don't initialize currentCalendarDate automatically
    // Only set it when user explicitly navigates calendar (via handleCalendarDateChange)
    // This allows initial load to use backend's default 60-day range
    
    // Track last calendar month to prevent duplicate refetches
    const lastCalendarMonthRef = useRef(null);
    
    // Track if this is the first calendar date change (initial mount)
    const isFirstCalendarDateChangeRef = useRef(true);
    
    // Callback to handle calendar date changes (only update if month actually changed)
    const handleCalendarDateChange = useCallback((newDate) => {
        if (!newDate) return;
        
        // On first change (component mount), don't set currentCalendarDate immediately
        // This allows initial load to use backend's default 60-day range
        if (isFirstCalendarDateChangeRef.current) {
            isFirstCalendarDateChangeRef.current = false;
            console.log('🔵 Live Availability - First calendar date change (mount), skipping to allow initial load');
            return;
        }
        
        const newMonth = `${newDate.getFullYear()}-${newDate.getMonth()}`;
        const lastMonth = lastCalendarMonthRef.current;
        
        // Only update if month actually changed
        if (newMonth !== lastMonth) {
            setCurrentCalendarDate(newDate);
            // Note: lastCalendarMonthRef will be updated in useEffect after fetch completes
        }
    }, []);
    
    // Track if Live Availability section was just opened (to force initial load)
    const liveAvailabilityJustOpenedRef = useRef(false);
    
    // CRITICAL FIX: Reset currentCalendarDate when activeAccordion changes to 'live-availability'
    // This ensures initial load uses backend's default 60-day range
    useEffect(() => {
        if (activeAccordion === 'live-availability') {
            // Always reset calendar date when section opens to force initial load
            console.log('🔵 Live Availability section opened - Resetting currentCalendarDate to force initial load');
            setCurrentCalendarDate(null);
            liveAvailabilityJustOpenedRef.current = true;
            // Reset first calendar date change flag when section opens
            isFirstCalendarDateChangeRef.current = true;
        } else {
            // Reset flag when section closes
            liveAvailabilityJustOpenedRef.current = false;
        }
    }, [activeAccordion]);
    
    // OPTIMIZATION: Refetch availabilities when Live Availability section opens or calendar month changes
    // This is the single source of truth for availability fetching
    useEffect(() => {
        if (chooseLocation && activityId && activeAccordion === 'live-availability') {
            // If currentCalendarDate is null, this is initial load - fetch without date range (backend default 60-day range)
            if (!currentCalendarDate) {
                // Check if we already have availabilities to avoid duplicate fetch
                const requestKey = `${chooseLocation}_${activityId}_${selectedVoucherType?.title || 'none'}_${chooseFlightType?.type || 'none'}_initial`;
                if (lastAvailabilitiesRequestRef.current === requestKey) {
                    console.log('🔵 Initial load already fetched, skipping');
                    return;
                }
                
                console.log('🔵 Live Availability opened - Initial load (no date range, using backend default 60-day range)');
                // Fetch immediately for initial load (skip debounce for faster loading)
                const timer = setTimeout(() => {
                    refetchAvailabilities(true); // Skip debounce for initial load
                }, 50); // Very small delay to ensure state is settled
                return () => clearTimeout(timer);
            } else {
                // Calendar month changed - fetch with date range
                const currentMonth = `${currentCalendarDate.getFullYear()}-${currentCalendarDate.getMonth()}`;
                
                // Skip if this month was already fetched (check both month ref and request key)
                const calendarKey = `${currentCalendarDate.getFullYear()}-${currentCalendarDate.getMonth() + 1}`;
                const expectedRequestKey = `${chooseLocation}_${activityId}_${selectedVoucherType?.title || 'none'}_${chooseFlightType?.type || 'none'}_${calendarKey}`;
                
                if (lastCalendarMonthRef.current === currentMonth && lastAvailabilitiesRequestRef.current === expectedRequestKey) {
                    console.log('🔵 Calendar month already fetched, skipping:', currentMonth);
                    return;
                }
                
                console.log('🔵 Calendar month changed, refetching availabilities for month:', currentCalendarDate);
                // Debounce the refetch to avoid multiple calls when month changes rapidly
                const timer = setTimeout(async () => {
                    await refetchAvailabilities(true); // Skip debounce for month changes
                    // Mark this month as fetched after successful request
                    lastCalendarMonthRef.current = currentMonth;
                }, 200);
                return () => clearTimeout(timer);
            }
        }
    }, [currentCalendarDate, chooseLocation, activityId, activeAccordion, refetchAvailabilities, selectedVoucherType?.title, chooseFlightType?.type]);

    // Ensure availability fetch runs on first Shopify deep-link (Buy Date/Voucher) load
    useEffect(() => {
        if (!shopifyStartAtVoucher) return;
        if (!chooseLocation || !activityId) return;
        
        // Detect mobile Chrome browser specifically
        const isMobileChrome = (() => {
            try {
                const ua = navigator.userAgent;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                return isMobile && isChrome;
            } catch {
                return false;
            }
        })();
        
        // For deep-link, we may not have flight type or voucher type yet; still fetch to avoid empty calendar
        // For mobile Chrome, use longer delay and multiple retries
        const initialDelay = isMobileChrome ? 1000 : 600;
        const timer = setTimeout(() => {
            console.log('[ShopifyDeepLink] Triggering availability fetch on first load', {
                chooseLocation,
                activityId,
                chooseFlightType: chooseFlightType?.type,
                selectedVoucherType: selectedVoucherType?.title,
                isMobileChrome
            });
            refetchAvailabilities();
            
            // For mobile Chrome, retry multiple times to ensure data loads
            if (isMobileChrome) {
                for (let i = 1; i <= 3; i++) {
                    setTimeout(() => {
                        console.log(`[ShopifyDeepLink] Mobile Chrome retry ${i} - fetching availabilities`);
                        refetchAvailabilities();
                    }, 1500 * i); // 1.5s, 3s, 4.5s delays
                }
            }
        }, initialDelay);
        return () => clearTimeout(timer);
    }, [shopifyStartAtVoucher, chooseLocation, activityId, chooseFlightType?.type, selectedVoucherType?.title, refetchAvailabilities]);

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
                
                // Update total price with voucher amount
                const voucherAmount = response.data.data.final_amount || response.data.data.voucher_amount || 0;
                if (voucherAmount > 0) {
                    setChooseFlightType(prev => ({
                        ...prev,
                        totalPrice: voucherAmount,
                        originalPrice: prev?.totalPrice || voucherAmount
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
                        const voucherPrice = voucherInfo.final_amount || voucherInfo.voucher_amount || 0;
                        setChooseFlightType({
                            type: voucherInfo.experience_type,
                            passengerCount: !Number.isNaN(resolvedPassengerCount) && resolvedPassengerCount > 0 
                                ? String(resolvedPassengerCount) 
                                : "1",
                            price: voucherPrice,
                            totalPrice: voucherPrice
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
                    // Priority: voucher_type_detail > detail.voucher_type_detail > voucher_type > detail.book_flight
                    let mappedVoucherType = null;
                    
                    if (voucherInfo.voucher_type_detail) {
                        mappedVoucherType = voucherInfo.voucher_type_detail;
                    } else if (voucherInfo.detail?.voucher_type_detail) {
                        mappedVoucherType = voucherInfo.detail.voucher_type_detail;
                    } else if (voucherInfo.voucher_type) {
                        mappedVoucherType = voucherInfo.voucher_type;
                    } else if (voucherInfo.detail?.book_flight) {
                        mappedVoucherType = voucherInfo.detail.book_flight;
                    }
                    
                    // If we found a voucher type, validate and set it
                    if (mappedVoucherType) {
                        // Valid voucher types: shared (Flexible Weekday, Weekday Morning, Any Day Flight) and private (Private Charter, Proposal Flight)
                        const validSharedTypes = ['Weekday Morning', 'Flexible Weekday', 'Any Day Flight', 'Weekday Morning Flight', 'Flexible Weekday Flight', 'Any Day'];
                        const validPrivateTypes = ['Private Charter', 'Proposal Flight'];
                        const validTypes = [...validSharedTypes, ...validPrivateTypes];
                        // Normalize the type name
                        let normalizedType = mappedVoucherType;
                        if (normalizedType === 'Weekday Morning Flight') {
                            normalizedType = 'Weekday Morning';
                        } else if (normalizedType === 'Flexible Weekday Flight') {
                            normalizedType = 'Flexible Weekday';
                        } else if (normalizedType === 'Any Day' || normalizedType === 'Anytime') {
                            normalizedType = 'Any Day Flight';
                        }
                        
                        if (!validTypes.includes(normalizedType) && !validTypes.includes(mappedVoucherType)) {
                            // Only default to 'Any Day Flight' for unknown types; preserve Private Charter and Proposal Flight
                            if (validPrivateTypes.some(t => mappedVoucherType.toLowerCase().includes(t.toLowerCase().split(' ')[0]))) {
                                normalizedType = mappedVoucherType; // Keep Private Charter or Proposal Flight as-is
                            } else {
                                normalizedType = 'Any Day Flight';
                                console.warn('Voucher type not in valid list, defaulting to Any Day Flight:', mappedVoucherType);
                            }
                        } else if (!validTypes.includes(normalizedType)) {
                            // Use the original if normalization didn't work but original is valid
                            normalizedType = mappedVoucherType;
                        }
                        
                        const selectedVoucherTypeQuantity = !Number.isNaN(resolvedPassengerCount) && resolvedPassengerCount > 0 ? resolvedPassengerCount : 1;
                        setSelectedVoucherType({
                            title: normalizedType,
                            quantity: selectedVoucherTypeQuantity,
                            price: voucherInfo.final_amount || 0
                        });
                        
                        console.log('Set selectedVoucherType from voucher data:', {
                            voucher_type_detail: voucherInfo.voucher_type_detail,
                            detail_voucher_type_detail: voucherInfo.detail?.voucher_type_detail,
                            voucher_type: voucherInfo.voucher_type,
                            detail_book_flight: voucherInfo.detail?.book_flight,
                            mappedVoucherType: mappedVoucherType,
                            normalizedType: normalizedType,
                            finalTitle: normalizedType
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
    }, [selectedVoucherType, chooseLocation, activityId, chooseFlightType]);
    
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
        
        // Check each field individually with proper null/undefined checks
        const hasName = details.name && typeof details.name === 'string' && details.name.trim() !== '';
        const hasEmail = details.email && typeof details.email === 'string' && details.email.trim() !== '';
        const hasPhone = typeof details.phone === 'string' && details.phone.length > 0;
        const hasDate = details.date && typeof details.date === 'string' && details.date.trim() !== '';
        
        // Email format validation (optional field)
        let emailFormatValid = true;
        if (hasEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            emailFormatValid = emailRegex.test(details.email.trim());
        }
        
        // Phone validation: optional but must not be whitespace-only if provided
        let phoneValid = true;
        if (hasPhone && !details.phone.trim()) {
            phoneValid = false;
        }
        
        // Date format validation (required)
        let dateFormatValid = true;
        if (hasDate) {
            const dateValue = new Date(details.date);
            dateFormatValid = !isNaN(dateValue.getTime());
        }
        
        // For Buy Gift: only Recipient Name and Gift Date are required.
        const isComplete = hasName && hasDate && emailFormatValid && phoneValid && dateFormatValid;
        
        console.log('🎁 recipientDetails validation:', {
            details,
            hasName: { value: details.name, valid: hasName },
            hasEmail: { value: details.email, valid: hasEmail },
            hasPhone: { value: details.phone, valid: hasPhone },
            hasDate: { value: details.date, valid: hasDate },
            emailFormatValid,
            phoneValid,
            dateFormatValid,
            isComplete,
            note: 'For Buy Gift: name and gift date required; email/phone optional'
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
            (voucherCode && String(voucherCode).trim()) &&
            voucherStatus === 'valid' &&
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
        
        // Get URL params for Shopify flow check
        const params = new URLSearchParams(location.search || '');
        
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
        
        // CRITICAL FIX: If live-availability is currently loading, prevent any section transitions
        // This handles cases where multiple completion calls happen in quick succession
        // Check BOTH state and ref (ref is synchronous, prevents race conditions from async state updates)
        const isLoadingCheck = isLiveAvailabilityLoading || isLiveAvailabilityLoadingRef.current;
        if (isLoadingCheck && completedSectionId !== 'live-availability') {
            console.log('⏳ Live Availability is loading, blocking completion of:', completedSectionId);
            return; // Don't process completion while live-availability is loading
        }
        
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
                // For Redeem Voucher: activity only complete when voucher is validated (green tick)
                if (activitySelect) {
                    if (activitySelect === 'Redeem Voucher') {
                        if (voucherStatus === 'valid') completedSections.push('activity');
                    } else {
                        completedSections.push('activity');
                    }
                }
                if (chooseLocation) completedSections.push('location');
                // For Redeem Voucher, experience is skipped in the flow, so don't check it for progress bar
                if (chooseFlightType?.type && activitySelect !== 'Redeem Voucher') {
                    completedSections.push('experience');
                }
                if (selectedVoucherType) completedSections.push('voucher-type');
                // Only mark live-availability as completed if date and time are selected
                // Don't mark it as completed just because section is open - wait for user to select date/time
                if (selectedDate && selectedTime) completedSections.push('live-availability');
                // Use proper passenger info validation based on activity type
                const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
                if (passengerComplete) completedSections.push('passenger-info');
                // Additional Information is optional unless API marks specific questions required
                if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');
                if (recipientDetails?.name && recipientDetails?.email && recipientDetails?.phone && recipientDetails?.date) completedSections.push('recipient-details');
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
                // CRITICAL FIX: If live-availability is loading and we're trying to switch to a different section,
                // block the transition. This handles cases where multiple completion calls happen in quick succession.
                // Check BOTH state and ref (ref is synchronous, prevents race conditions from async state updates)
                const isLoadingCheck = isLiveAvailabilityLoading || isLiveAvailabilityLoadingRef.current;
                if (isLoadingCheck && nextSection !== 'live-availability') {
                    console.log('⏳ Live Availability is loading, blocking transition to:', nextSection);
                    return; // Don't switch sections while live-availability is loading
                }
                
                // Detect Chrome browser for special handling
                const isChromeBrowser = navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg');
                const hasLocationAndActivity = chooseLocation && selectedActivity && selectedActivity.length > 0;
                const shouldHaveAvailabilities = hasLocationAndActivity && (
                    (activitySelect === 'Book Flight' && (chooseFlightType?.type || (params.get('source') === 'shopify' && hasLocationAndActivity))) ||
                    (activitySelect === 'Redeem Voucher') ||
                    (chooseLocation === 'Bristol Fiesta') ||
                    (activitySelect !== 'Book Flight' && activitySelect !== 'Redeem Voucher')
                );
                
                // Special handling for Live Availability section
                if (nextSection === 'live-availability') {
                    // CRITICAL FIX: ALWAYS set loading state when opening live-availability from Shopify flow
                    // Even if availabilities are already loaded, we need a guard period to prevent
                    // race conditions where another completion call immediately switches to experience section
                    const isShopifyFlow = params.get('source') === 'shopify';
                    const isVoucherTypeStart = params.get('startAt') === 'voucher-type';
                    
                    // Shopify voucher-type flow: wait until ALL accordions are loaded, terms are loaded, AND network requests complete
                    if (isShopifyFlow && isVoucherTypeStart) {
                        // CRITICAL: Use ref for activityId check to avoid stale state issues
                        const hasRequiredState = chooseLocation && activityIdRef.current && chooseFlightType?.type && selectedVoucherType?.title;
                        const termsReady = voucherTermsLoadedRef.current || !voucherTermsLoading; // Terms loaded or not loading
                        const accordionsReady = !accordionLoadingStates.isAccordionLoading && accordionLoadedRef.current; // All accordions loaded
                        
                        // CRITICAL FIX: If terms are accepted (termsReady) and voucher-type section is completed,
                        // allow opening Live Availability section even if activityId is not ready yet
                        // This ensures the section opens immediately after terms acceptance
                        const isTermsAccepted = voucherTermsLoadedRef.current && !voucherTermsLoading;
                        const isVoucherTypeCompleted = completedSectionId === 'voucher-type' && selectedVoucherType?.title;
                        const shouldOpenAfterTermsAcceptance = isTermsAccepted && isVoucherTypeCompleted && chooseLocation && chooseFlightType?.type;
                        
                        console.log('[ShopifyDebug] Live Availability guard check - COMPREHENSIVE', {
                            hasRequiredState,
                            termsReady,
                            accordionsReady,
                            voucherTermsLoading,
                            voucherTermsLoaded: voucherTermsLoadedRef.current,
                            accordionLoadingStates,
                            accordionLoaded: accordionLoadedRef.current,
                            activityIdRef: activityIdRef.current,
                            chooseLocation,
                            hasFlightType: !!chooseFlightType?.type,
                            hasVoucherType: !!selectedVoucherType?.title,
                            isTermsAccepted,
                            isVoucherTypeCompleted,
                            shouldOpenAfterTermsAcceptance,
                            completedSectionId
                        });
                        
                        // CRITICAL FIX: If terms are accepted and voucher-type is completed, open section immediately
                        // even if activityId is not ready yet (it will be fetched in the background)
                        if (shouldOpenAfterTermsAcceptance && accordionsReady) {
                            console.log('[ShopifyDebug] Terms accepted and voucher-type completed, opening Live Availability immediately');
                            setIsLiveAvailabilityLoadingSync(true);
                            // Open section immediately, activityId will be fetched in background
                            setActiveAccordion('live-availability');
                            // Continue to the "All checks passed" block to handle availabilities fetch
                            // This ensures the section opens but loading state is maintained until data arrives
                            // Force hasRequiredState to true to fall through to "All checks passed" block
                            // Note: We'll still check activityId in the "All checks passed" block
                        }
                        
                        if (!shouldOpenAfterTermsAcceptance && (!hasRequiredState || !termsReady || !accordionsReady)) {
                            // Cancel any previous guard timer
                            if (liveAvailabilityGuardTimerRef.current) {
                                clearTimeout(liveAvailabilityGuardTimerRef.current);
                            }
                            liveAvailabilityGuardStartRef.current = Date.now();
                            
                            // Keep loading visible during wait
                            setIsLiveAvailabilityLoadingSync(true);
                            
                            const waitForState = () => {
                                const elapsed = Date.now() - (liveAvailabilityGuardStartRef.current || Date.now());
                                const readyNow = chooseLocationRef.current && 
                                                activityIdRef.current && 
                                                chooseFlightTypeRef.current?.type && 
                                                selectedVoucherTypeRef.current?.title &&
                                                (voucherTermsLoadedRef.current || !voucherTermsLoading) &&
                                                (!accordionLoadingStates.isAccordionLoading && accordionLoadedRef.current);
                                
                                // CRITICAL: Even on timeout, require activityId - do not open without it
                                const hasActivityId = !!activityIdRef.current;
                                
                                if (readyNow || (elapsed >= 8000 && hasActivityId)) {
                                    // Proceed to open after state ready or 8s timeout (increased for slow networks)
                                    // If timeout but no activityId, continue waiting
                                    if (elapsed >= 8000 && !hasActivityId) {
                                        console.log('[ShopifyDebug] Guard timeout but activityId still null, continuing wait', {
                                            elapsed,
                                            hasActivityId
                                        });
                                        // Continue waiting for activityId (max 15 seconds total)
                                        if (elapsed < 15000) {
                                            liveAvailabilityGuardTimerRef.current = setTimeout(waitForState, 200);
                                        } else {
                                            // Absolute timeout, log error but don't open
                                            console.error('[ShopifyDebug] Guard: Absolute timeout reached, activityId still null - cannot open section');
                                            setIsLiveAvailabilityLoadingSync(false);
                                            liveAvailabilityGuardTimerRef.current = null;
                                        }
                                        return;
                                    }
                                    
                                    console.log('[ShopifyDebug] Live Availability guard complete, ensuring availabilities loaded', {
                                        readyNow,
                                        elapsed,
                                        hasActivityId,
                                        termsReady: voucherTermsLoadedRef.current || !voucherTermsLoading,
                                        accordionsReady: !accordionLoadingStates.isAccordionLoading && accordionLoadedRef.current,
                                        hasAvailabilities: !!availabilities?.length,
                                        availabilitiesCount: availabilities?.length || 0
                                    });
                                    
                                    // CRITICAL FIX: Ensure availabilities are loaded before opening section
                                    const openSection = () => {
                                        // CRITICAL: Final check - do not open if activityId is still null
                                        if (!activityIdRef.current) {
                                            console.log('[ShopifyDebug] openSection: activityId still null, cannot open section');
                                            // Continue waiting for activityId
                                            liveAvailabilityGuardTimerRef.current = setTimeout(waitForState, 200);
                                            return;
                                        }
                                        
                                        // CRITICAL: Verify availabilities are loaded using ref (synchronous check)
                                        const currentAvailabilities = availabilitiesRef.current;
                                        if (!currentAvailabilities || currentAvailabilities.length === 0) {
                                            console.log('[ShopifyDebug] openSection: availabilities still empty, fetching before opening');
                                            // Fetch availabilities before opening
                                            refetchAvailabilities().then((data) => {
                                                if (data && data.length > 0) {
                                                    // Poll for state update
                                                    let pollCount = 0;
                                                    const maxPolls = 15;
                                                    const pollForUpdate = () => {
                                                        pollCount++;
                                                        if (availabilitiesRef.current && availabilitiesRef.current.length > 0) {
                                                            // Now safe to open
                                                            console.log('[ShopifyDebug] openSection: Availabilities loaded, opening section');
                                                            setActiveAccordion('live-availability');
                                                            setIsLiveAvailabilityLoadingSync(true);
                                                            setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                                        } else if (pollCount < maxPolls) {
                                                            setTimeout(pollForUpdate, 200);
                                                        } else {
                                                            // Timeout, open anyway
                                                            console.log('[ShopifyDebug] openSection: Polling timeout, opening anyway');
                                                            setActiveAccordion('live-availability');
                                                            setIsLiveAvailabilityLoadingSync(true);
                                                            setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                                        }
                                                    };
                                                    setTimeout(pollForUpdate, 500);
                                                } else {
                                                    // Empty data, open anyway after delay
                                                    console.log('[ShopifyDebug] openSection: Availabilities fetch returned empty, opening anyway');
                                                    setActiveAccordion('live-availability');
                                                    setIsLiveAvailabilityLoadingSync(true);
                                                    setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                                }
                                            }).catch(() => {
                                                // Error, open anyway after delay
                                                console.log('[ShopifyDebug] openSection: Availabilities fetch failed, opening anyway');
                                                setActiveAccordion('live-availability');
                                                setIsLiveAvailabilityLoadingSync(true);
                                                setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                            });
                                            return;
                                        }
                                        
                                        console.log('[ShopifyDebug] Opening Live Availability section');
                                        setActiveAccordion('live-availability');
                                        setIsLiveAvailabilityLoadingSync(true);
                                        // Small guard period to let voucher section finish rendering
                                        setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                    };
                                    
                                    // CRITICAL: Check if activityId is available before fetching
                                    if (!activityIdRef.current) {
                                        console.log('[ShopifyDebug] Guard: activityId not ready, waiting...');
                                        // Continue waiting for activityId
                                        liveAvailabilityGuardTimerRef.current = setTimeout(waitForState, 200);
                                        return;
                                    }
                                    
                                    // If availabilities are empty, fetch them first
                                    if (!availabilities || availabilities.length === 0) {
                                        console.log('[ShopifyDebug] Availabilities empty in guard, fetching before opening');
                                        
                                        refetchAvailabilities().then((data) => {
                                            
                                            // CRITICAL: Verify data was actually fetched
                                            if (!data || data.length === 0) {
                                                console.log('[ShopifyDebug] Guard: Availabilities fetch returned empty, retrying...');
                                                // Retry once more
                                                setTimeout(() => {
                                                    refetchAvailabilities().then((retryData) => {
                                                        if (retryData && retryData.length > 0) {
                                                            setTimeout(openSection, 2000);
                                                        } else {
                                                            // Still empty, open anyway after delay
                                                            setTimeout(openSection, 3000);
                                                        }
                                                    }).catch(() => {
                                                        setTimeout(openSection, 3000);
                                                    });
                                                }, 2000);
                                                return;
                                            }
                                            
                                            // CRITICAL: Wait for availabilities state to actually update
                                            // Poll availabilities state to ensure it's set before opening
                                            let pollCount = 0;
                                            const maxPolls = 20; // 4 seconds max (200ms * 20)
                                            const pollForAvailabilities = () => {
                                                pollCount++;
                                                // Check if availabilities are now loaded using ref (synchronous)
                                                const currentAvailabilities = availabilitiesRef.current;
                                                if (currentAvailabilities && currentAvailabilities.length > 0) {
                                                    console.log('[ShopifyDebug] Guard: Availabilities loaded, opening section after delay', {
                                                        count: currentAvailabilities.length
                                                    });
                                                    // Wait additional 1-2 seconds for network stability
                                                    setTimeout(openSection, 2000);
                                                } else if (pollCount < maxPolls) {
                                                    // Continue polling
                                                    setTimeout(pollForAvailabilities, 200);
                                                } else {
                                                    // Timeout, open anyway
                                                    console.log('[ShopifyDebug] Guard: Availabilities polling timeout, opening section anyway');
                                                    setTimeout(openSection, 2000);
                                                }
                                            };
                                            
                                            // Start polling after a short delay to let state update
                                            setTimeout(pollForAvailabilities, 500);
                                        }).catch((error) => {
                                            // Open anyway after 3 seconds
                                            setTimeout(openSection, 3000);
                                        });
                                    } else {
                                        // Availabilities already loaded, wait 2.5 seconds for network stability
                                        // But verify they're still loaded before opening using ref
                                        setTimeout(() => {
                                            const currentAvailabilities = availabilitiesRef.current;
                                            if (currentAvailabilities && currentAvailabilities.length > 0) {
                                                console.log('[ShopifyDebug] Guard: Availabilities confirmed loaded, opening section');
                                                openSection();
                                            } else {
                                                console.log('[ShopifyDebug] Guard: Availabilities disappeared, fetching again');
                                                // Availabilities disappeared, fetch again
                                                refetchAvailabilities().then((data) => {
                                                    if (data && data.length > 0) {
                                                        // Poll for state update
                                                        let pollCount = 0;
                                                        const maxPolls = 15;
                                                        const pollForUpdate = () => {
                                                            pollCount++;
                                                            if (availabilitiesRef.current && availabilitiesRef.current.length > 0) {
                                                                setTimeout(openSection, 2000);
                                                            } else if (pollCount < maxPolls) {
                                                                setTimeout(pollForUpdate, 200);
                                                            } else {
                                                                setTimeout(openSection, 3000);
                                                            }
                                                        };
                                                        setTimeout(pollForUpdate, 500);
                                                    } else {
                                                        setTimeout(openSection, 3000);
                                                    }
                                                }).catch(() => {
                                                    setTimeout(openSection, 3000);
                                                });
                                            }
                                        }, 2500);
                                    }
                                    
                                    liveAvailabilityGuardTimerRef.current = null;
                                    return;
                                }
                                liveAvailabilityGuardTimerRef.current = setTimeout(waitForState, 200);
                            };
                            
                            liveAvailabilityGuardTimerRef.current = setTimeout(waitForState, 200);
                            return; // Defer normal flow until ready/timeout
                        }
                        
                        // All checks passed (or terms accepted), but ensure availabilities are loaded before opening
                        {
                            console.log('[ShopifyDebug] All checks passed, ensuring availabilities are loaded before opening Live Availability');
                            setIsLiveAvailabilityLoadingSync(true);
                            
                            // CRITICAL FIX: Check activityId first using ref to avoid stale state, then fetch availabilities if needed
                            if (!activityIdRef.current) {
                                console.log('[ShopifyDebug] activityId not ready, waiting before opening section');
                                // Poll for activityId
                                let pollCount = 0;
                                const maxPolls = 20; // 4 seconds max (200ms * 20)
                                const pollForActivityId = () => {
                                    pollCount++;
                                    if (activityIdRef.current) {
                                        // activityId ready, proceed with availabilities check
                                        if (!availabilities || availabilities.length === 0) {
                                            fetchAndOpenSection();
                                        } else {
                                            setTimeout(() => {
                                                setActiveAccordion('live-availability');
                                                setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                            }, 2000);
                                        }
                                    } else if (pollCount < maxPolls) {
                                        setTimeout(pollForActivityId, 200);
                                    } else {
                                        // Timeout, open anyway
                                        console.log('[ShopifyDebug] activityId polling timeout, opening section anyway');
                                        setActiveAccordion('live-availability');
                                        setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                    }
                                };
                                setTimeout(pollForActivityId, 200);
                                return;
                            }
                            
                            // Helper function to fetch and open section
                            const fetchAndOpenSection = () => {
                                console.log('[ShopifyDebug] Availabilities empty, fetching before opening section');
                                
                                // CRITICAL: If activityId is null, wait for it before fetching
                                if (!activityIdRef.current) {
                                    console.log('[ShopifyDebug] fetchAndOpenSection: activityId null, waiting before fetch');
                                    // Poll for activityId
                                    let pollCount = 0;
                                    const maxPolls = 20; // 4 seconds max
                                    const pollForActivityId = () => {
                                        pollCount++;
                                        if (activityIdRef.current) {
                                            // activityId ready, proceed with fetch
                                            refetchAvailabilities().then((data) => {
                                                handleFetchResult(data);
                                            }).catch((error) => {
                                                handleFetchError(error);
                                            });
                                        } else if (pollCount < maxPolls) {
                                            setTimeout(pollForActivityId, 200);
                                        } else {
                                            // Timeout, open section anyway but keep loading active
                                            console.log('[ShopifyDebug] fetchAndOpenSection: activityId polling timeout, opening section with loading');
                                            setActiveAccordion('live-availability');
                                            // Keep loading state active - LiveAvailabilitySection will handle showing loading UI
                                        }
                                    };
                                    setTimeout(pollForActivityId, 200);
                                    return;
                                }
                                
                                // Helper function to handle fetch result
                                const handleFetchResult = (data) => {
                                    
                                    // CRITICAL: Verify data was actually fetched
                                    if (!data || data.length === 0) {
                                        console.log('[ShopifyDebug] Availabilities fetch returned empty, retrying...');
                                        // Retry once more
                                        setTimeout(() => {
                                            refetchAvailabilities().then((retryData) => {
                                                if (retryData && retryData.length > 0) {
                                                    setTimeout(() => {
                                                        setActiveAccordion('live-availability');
                                                        setTimeout(() => {
                                                            const currentAvailabilities = availabilitiesRef.current;
                                                            if (currentAvailabilities && currentAvailabilities.length > 0) {
                                                                setIsLiveAvailabilityLoadingSync(false);
                                                            } else {
                                                                // Keep loading state active
                                                            }
                                                        }, 500);
                                                    }, 2000);
                                                } else {
                                                    // Still empty, open anyway but keep loading state active
                                                    setTimeout(() => {
                                                        setActiveAccordion('live-availability');
                                                        // Keep loading state active - LiveAvailabilitySection will handle showing loading UI
                                                    }, 3000);
                                                }
                                            }).catch(() => {
                                                setTimeout(() => {
                                                    setActiveAccordion('live-availability');
                                                    // Keep loading state active on error - LiveAvailabilitySection will handle showing loading UI
                                                }, 3000);
                                            });
                                        }, 2000);
                                        return;
                                    }
                                    
                                    // Wait additional 1-2 seconds for state to settle, then open
                                    setTimeout(() => {
                                        console.log('[ShopifyDebug] Availabilities loaded, opening Live Availability section');
                                        setActiveAccordion('live-availability');
                                        // CRITICAL: Verify availabilities are actually loaded before clearing loading state
                                        setTimeout(() => {
                                            const currentAvailabilities = availabilitiesRef.current;
                                            if (currentAvailabilities && currentAvailabilities.length > 0) {
                                                setIsLiveAvailabilityLoadingSync(false);
                                            } else {
                                                console.log('[ShopifyDebug] Availabilities still empty after fetch, keeping loading state active');
                                                // Keep loading state active - LiveAvailabilitySection will handle showing loading UI
                                            }
                                        }, 500);
                                    }, 2000);
                                };
                                
                                // Helper function to handle fetch error
                                const handleFetchError = (error) => {
                                    // Open anyway after timeout but keep loading state active
                                    setTimeout(() => {
                                        setActiveAccordion('live-availability');
                                        // Keep loading state active on error - LiveAvailabilitySection will handle showing loading UI
                                    }, 3000);
                                };
                                
                                // Fetch and wait for completion
                                refetchAvailabilities().then((data) => {
                                    handleFetchResult(data);
                                }).catch((error) => {
                                    handleFetchError(error);
                                });
                            };
                            
                            // CRITICAL FIX: If availabilities are empty, fetch them first and wait for completion
                            if (!availabilities || availabilities.length === 0) {
                                // CRITICAL: Keep loading state active while fetching
                                setIsLiveAvailabilityLoadingSync(true);
                                fetchAndOpenSection();
                            } else {
                                // Availabilities already loaded, wait 2-3 seconds for network stability
                                setTimeout(() => {
                                    console.log('[ShopifyDebug] Network stability delay complete, opening Live Availability section');
                                    setActiveAccordion('live-availability');
                                    // CRITICAL: If availabilities are still empty after delay, keep loading state active
                                    setTimeout(() => {
                                        const currentAvailabilities = availabilitiesRef.current;
                                        if (!currentAvailabilities || currentAvailabilities.length === 0) {
                                            console.log('[ShopifyDebug] Availabilities still empty after delay, keeping loading state active');
                                            // Keep loading state active - LiveAvailabilitySection will handle showing loading UI
                                        } else {
                                            setIsLiveAvailabilityLoadingSync(false);
                                        }
                                    }, 500);
                                }, 2500);
                            }
                            return; // Defer normal flow
                        }
                    }
                    
                    // For Shopify flow on mobile Chrome, ALWAYS set loading state temporarily
                    // to create a guard period that blocks other completions
                    if (isShopifyFlow || (!availabilities || availabilities.length === 0)) {
                        // Set loading state immediately before opening section
                        setIsLiveAvailabilityLoadingSync(true);
                        console.log('⏳ Setting loading state before opening Live Availability section (guard period)', {
                            isChromeBrowser,
                            isShopifyFlow,
                            availabilitiesCount: availabilities?.length || 0
                        });
                        
                        // For Shopify flow, ensure loading state stays active for a minimum period
                        // This prevents race conditions on mobile Chrome
                        if (isShopifyFlow && availabilities && availabilities.length > 0) {
                            // Availabilities already loaded, but set minimum guard period
                            setTimeout(() => {
                                setIsLiveAvailabilityLoadingSync(false);
                                console.log('✅ Guard period complete, clearing loading state');
                            }, 1500); // 1.5 second guard period
                        }
                    }
                }
                
                // Special handling: If Live Availability section is currently open and loading,
                // don't switch to another section - keep Live Availability open
                // CRITICAL FIX: Also check if we just opened live-availability (activeAccordion might be stale in closure)
                const isShopifyFlowCheck = params.get('source') === 'shopify';
                const isLoadingCheckForOpen = isLiveAvailabilityLoading || isLiveAvailabilityLoadingRef.current;
                const justOpenedLiveAvailability = nextSection === 'live-availability' && 
                    (activeAccordion !== 'live-availability' || isLoadingCheckForOpen);
                
                if ((activeAccordion === 'live-availability' || justOpenedLiveAvailability) && nextSection !== 'live-availability') {
                    // Check if availabilities are still loading using the loading state from child component
                    // This is more reliable than checking availabilities array, especially for Chrome/mobile
                    // Check BOTH state and ref (ref is synchronous)
                    if (isLoadingCheckForOpen) {
                        console.log('⏳ Live Availability is loading (from child component), keeping section open instead of switching to:', nextSection);
                        return; // Don't switch sections while loading
                    }
                    
                    // Fallback: Also check if availabilities are still loading based on data
                    // For Shopify flow, be more aggressive about blocking
                    const availabilitiesLoading = (!availabilities || availabilities.length === 0) && 
                        (shouldHaveAvailabilities || isShopifyFlowCheck);
                    
                    if (availabilitiesLoading) {
                        console.log('⏳ Live Availability is loading (data check), keeping section open instead of switching to:', nextSection);
                        return; // Don't switch sections while loading
                    }
                }
                
                // For Chrome/mobile: If opening live-availability and it should have availabilities but doesn't,
                // add extra delay to ensure loading state is set before any subsequent section transitions
                if (nextSection === 'live-availability' && shouldHaveAvailabilities && (!availabilities || availabilities.length === 0)) {
                    if (isChromeBrowser) {
                        console.log('⏳ Chrome/Mobile: Opening Live Availability with loading state, will prevent auto-advance');
                        // The loading state is already set above, so we can proceed with opening the section
                    }
                }
                
                console.log('🔓 Opening next section:', nextSection, `(${sequence.indexOf(nextSection) + 1}/${sequence.length})`);
                setActiveAccordion(nextSection);

                setTimeout(() => {
                    try {
                        scrollToPortalSection(nextSection);
                    } catch (e) {
                        console.warn('scrollToPortalSection failed for', nextSection, e);
                    }
                }, 50);
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
        // For Redeem Voucher: activity only complete when voucher is validated (green tick)
        if (activitySelect) {
            if (activitySelect === 'Redeem Voucher') {
                if (voucherStatus === 'valid') completedSections.push('activity');
            } else {
                completedSections.push('activity');
            }
        }
        if (chooseLocation) completedSections.push('location');
        // For Redeem Voucher, experience is skipped in the flow, so don't check it for progress bar
        // Check if experience is completed: either chooseFlightType is set, or we're in Shopify flow with experience param
        const hasExperienceFromShopify = (() => {
            try {
                const params = new URLSearchParams(location.search || '');
                return params.get('source') === 'shopify' && params.get('experience');
            } catch {
                return false;
            }
        })();
        if ((chooseFlightType?.type || hasExperienceFromShopify) && activitySelect !== 'Redeem Voucher') {
            completedSections.push('experience');
        }
        if (selectedVoucherType) completedSections.push('voucher-type');
        if (selectedDate && selectedTime) completedSections.push('live-availability');
        // Use proper passenger info validation based on activity type
        const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
        if (passengerComplete) completedSections.push('passenger-info');
        // Additional Information is optional unless API marks specific questions required
        if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');

        // Recipient Details (Buy Gift only):
        // Use the same validation rules as the booking button:
        // - Recipient Name and Gift Date required
        // - Email / Phone optional (but validated if provided)
        if (activitySelect === 'Buy Gift' && isRecipientDetailsValid(recipientDetails)) {
            completedSections.push('recipient-details');
        }
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
                    ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim() :
                    (recipientDetails?.phone || (passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
                mobile: isGiftVoucher ? 
                    ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim() :
                    (recipientDetails?.phone || (passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
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
                purchaser_phone: isGiftVoucher ? ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim() : "",
                purchaser_mobile: isGiftVoucher ? ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim() : "",
                numberOfPassengers: resolveVoucherPassengerCount(),
                passengerData: passengerData.map(p => ({
                    ...p,
                    phone: (p.countryCode && p.phone) ? `${p.countryCode}${p.phone}`.trim() : (p.phone || '')
                })), // Send passenger data with combined phone numbers (countryCode + phone)
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
                phone: ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
                mobile: ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
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
                purchaser_phone: ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
                purchaser_mobile: ((passengerData?.[0]?.countryCode || '') + (passengerData?.[0]?.phone || "")).trim(),
                numberOfPassengers: resolveVoucherPassengerCount(),
                passengerData: passengerData.map(p => ({
                    ...p,
                    phone: (p.countryCode && p.phone) ? `${p.countryCode}${p.phone}`.trim() : (p.phone || '')
                })), // Send passenger data with combined phone numbers (countryCode + phone)
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
            // Use timezone-safe date formatting to avoid 1-day offset issues
            let bookingDateStr = selectedDate;
            if (selectedDate instanceof Date && selectedTime) {
                const [h, m, s] = selectedTime.split(":");
                // Use getFullYear(), getMonth(), getDate() directly to avoid timezone conversions
                // These methods return local time values, which is what we want
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth() + 1; // getMonth() returns 0-11
                const day = selectedDate.getDate();
                const hour = Number(h);
                const minute = Number(m);
                const second = Number(s) || 0;
                // Format as YYYY-MM-DD HH:mm:ss without timezone conversion
                bookingDateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}`;
            } else if (selectedDate instanceof Date) {
                // Use getFullYear(), getMonth(), getDate() directly to avoid timezone conversions
                const year = selectedDate.getFullYear();
                const month = selectedDate.getMonth() + 1; // getMonth() returns 0-11
                const day = selectedDate.getDate();
                bookingDateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            }
            
            // Combine countryCode and phone for each passenger in passengerData for Redeem Voucher bookingData
            const redeemBookingPassengerDataWithPhoneCode = passengerData.map(p => ({
                ...p,
                phone: (p.countryCode && p.phone) ? `${p.countryCode}${p.phone}`.trim() : (p.phone || '')
            }));

            const bookingData = {
                activitySelect: "Redeem Voucher",
                chooseLocation,
                chooseFlightType,
                selectedVoucherType,
                chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [],
                passengerData: redeemBookingPassengerDataWithPhoneCode, // Use passengerData with combined phone numbers
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
                
                // Combine countryCode and phone for each passenger in passengerData for Redeem Voucher
                const redeemPassengerDataWithPhoneCode = passengerData.map(p => ({
                    ...p,
                    phone: (p.countryCode && p.phone) ? `${p.countryCode}${p.phone}`.trim() : (p.phone || '')
                }));

                // Call simplified createRedeemBooking endpoint for Redeem Voucher
                const redeemBookingData = {
                    activitySelect,
                    chooseLocation,
                    chooseFlightType,
                    passengerData: redeemPassengerDataWithPhoneCode, // Use passengerData with combined phone numbers
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
        // Combine countryCode and phone for each passenger in passengerData
        const passengerDataWithPhoneCode = passengerData.map(p => ({
            ...p,
            phone: (p.countryCode && p.phone) ? `${p.countryCode}${p.phone}`.trim() : (p.phone || '')
        }));

        const bookingData = {
            activitySelect,
            chooseLocation,
            chooseFlightType,
            selectedVoucherType, // Add selectedVoucherType for voucher code generation
            chooseAddOn: Array.isArray(chooseAddOn) ? chooseAddOn : [], // Opsiyonel - boş array olabilir
            passengerData: passengerDataWithPhoneCode, // Use passengerData with combined phone numbers
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
        // For Shopify flow, use refetchAvailabilities to ensure correct parameters and timing
        // For Bing/Edge browsers, use more aggressive retry mechanism
        if (chooseLocation && activeAccordion === "live-availability") {
            // Check if we're in Shopify flow
            const params = new URLSearchParams(location.search || '');
            const isShopifyFlow = params.get('source') === 'shopify';
            const isVoucherTypeStart = params.get('startAt') === 'voucher-type';
            
            // Detect Bing/Edge browser for more aggressive retry
            const isBingBrowser = navigator.userAgent.includes('Edg') || navigator.userAgent.includes('Bing');
            
            // Detect mobile Chrome browser specifically (critical for fixing mobile Chrome bug)
            const isMobileChrome = (() => {
                try {
                    const ua = navigator.userAgent;
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                    const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                    return isMobile && isChrome;
                } catch {
                    return false;
                }
            })();
            
            // CRITICAL: If availabilities are empty and we have activityId, fetch immediately
            const hasNoAvailabilities = !availabilities || availabilities.length === 0;
            
            // CRITICAL FIX: For Shopify flow, if section was just opened and availabilities are empty,
            // don't fetch immediately - wait for the guard mechanism to ensure availabilities are loaded
            // This prevents the race condition where section opens before availabilities are ready
            const paramsForCheck = new URLSearchParams(location.search || '');
            const isShopifyFlowCheck = paramsForCheck.get('source') === 'shopify';
            const isVoucherTypeStartCheck = paramsForCheck.get('startAt') === 'voucher-type';
            const isJustOpened = isShopifyFlowCheck && isVoucherTypeStartCheck;
            
            // (debug instrumentation removed)
            
            if (isShopifyFlow) {
                // For Shopify flow, ensure all required state is ready before fetching
                // Check if activityId is ready (it might be set asynchronously)
                if (activityId) {
                    // For Shopify flow, use refetchAvailabilities which has proper state handling
                    console.log('🔵 Live Availability opened in Shopify flow - Using refetchAvailabilities', {
                        chooseLocation,
                        activityId,
                        chooseFlightType: chooseFlightType?.type,
                        selectedVoucherType: selectedVoucherType?.title,
                        isBingBrowser,
                        isMobileChrome,
                        hasNoAvailabilities,
                        isVoucherTypeStart,
                        isJustOpened
                    });
                    
                    // CRITICAL FIX: If section was just opened via guard mechanism, availabilities should already be loaded
                    // Only fetch if availabilities are truly empty AND we're not in the initial opening flow
                    // This prevents race conditions where section opens before availabilities are ready
                    if (hasNoAvailabilities && !isJustOpened) {
                        console.log('🔵 Live Availability - Availabilities empty, fetching immediately', {
                            isMobileChrome
                        });
                        refetchAvailabilities().then((data) => {
                        }).catch((error) => {
                        });
                    } else if (hasNoAvailabilities && isJustOpened) {
                        console.log('🔵 Live Availability - Section just opened via guard, availabilities should be loading, skipping immediate fetch');
                    }
                    
                    // For mobile Chrome and Bing browser, use longer delay and multiple retries
                    const delay = isMobileChrome ? 1000 : (isBingBrowser ? 800 : 500);
                    const timer = setTimeout(() => {
                        // Only refetch if still empty (avoid duplicate calls)
                        if (hasNoAvailabilities) {
                            refetchAvailabilities();
                        }
                        // For mobile Chrome and Bing browser, retry multiple times
                        if (isMobileChrome || isBingBrowser) {
                            const retryCount = isMobileChrome ? 3 : 1; // Mobile Chrome needs more retries
                            for (let i = 1; i <= retryCount; i++) {
                            setTimeout(() => {
                                    console.log(`🔵 ${isMobileChrome ? 'Mobile Chrome' : 'Bing browser'} - Retrying availability fetch (attempt ${i + 1})`);
                                if (!availabilities || availabilities.length === 0) {
                                    refetchAvailabilities();
                                }
                                }, 1000 * i); // 1s, 2s, 3s delays for mobile Chrome
                            }
                        }
                    }, delay);
                    return () => clearTimeout(timer);
                } else {
                    // CRITICAL FIX: If activityId is not ready yet, poll for it and fetch when ready
                    // This fixes the issue where Live Availability opens before activityId is set
                    console.log('🔵 Live Availability opened in Shopify flow - Waiting for activityId', { 
                        chooseLocation,
                        flightType: chooseFlightType?.type,
                        isBingBrowser,
                        isMobileChrome 
                    });
                    
                    // Poll for activityId with increasing delays
                    let pollAttempt = 0;
                    const maxPollAttempts = 10; // Poll up to 10 times (total ~5-10 seconds)
                    const pollInterval = 500; // Start with 500ms, increase by 200ms each time
                    
                    const pollForActivityId = () => {
                        pollAttempt++;
                        // Check current activityId value from ref (not closure value)
                        const currentActivityId = activityIdRef.current;

                        // (debug instrumentation removed)
                        
                        if (currentActivityId) {
                            console.log('🔵 Live Availability - activityId ready, fetching availabilities', {
                                attempt: pollAttempt,
                                activityId: currentActivityId
                            });

                            // (debug instrumentation removed)

                            refetchAvailabilities();
                            
                            // For mobile Chrome and Bing browser, retry multiple times after initial fetch
                            if (isMobileChrome || isBingBrowser) {
                                const retryCount = isMobileChrome ? 3 : 1;
                                const retryDelay = isMobileChrome ? 2000 : 1500;
                                for (let i = 1; i <= retryCount; i++) {
                                    setTimeout(() => {
                                        refetchAvailabilities();
                                    }, retryDelay * i);
                                }
                            }
                        } else if (pollAttempt < maxPollAttempts && chooseLocation) {
                            // Continue polling if we haven't exceeded max attempts and location is set
                            const nextDelay = pollInterval + (pollAttempt * 200); // Increasing delay
                            console.log('🔵 Live Availability - activityId still not ready, polling again', {
                                attempt: pollAttempt,
                                nextDelay
                            });
                            setTimeout(pollForActivityId, nextDelay);
                        } else {
                            console.log('🔵 Live Availability - activityId polling exhausted or location not set', {
                                pollAttempt,
                                maxPollAttempts,
                                chooseLocation
                            });

                            // (debug instrumentation removed)
                        }
                    };
                    
                    // Start polling after initial delay
                    const initialDelay = isMobileChrome ? 800 : (isBingBrowser ? 600 : 400);
                    const timer = setTimeout(pollForActivityId, initialDelay);
                    return () => clearTimeout(timer);
                }
            } else {
                // For non-Shopify flow, use the original fetch logic
                const fetchAvailabilities = async () => {
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
                        // For Redeem Voucher:
                        // - Private Charter vouchers should NOT be restricted by voucherTypes here.
                        //   We rely on activityId + flight type filtering so that all valid
                        //   Private Charter slots for this activity are shown.
                        if (chooseFlightType.type === 'Private Charter') {
                            console.log('Redeem Voucher (Private Charter): skipping voucherTypes filter so all Private Charter availabilities for this activity are visible');
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
        };
        fetchAvailabilities();
            }
        }
    }, [chooseLocation, activeAccordion, chooseFlightType, selectedVoucherType, activityId, location.search, refetchAvailabilities]);
    
    // Additional effect: For Bing browser, ensure availabilities are fetched when Live Availability section is open
    useEffect(() => {
        // Detect Bing/Edge browser
        const isBingBrowser = navigator.userAgent.includes('Edg') || navigator.userAgent.includes('Bing');
        if (!isBingBrowser) return;
        
        // Only run when Live Availability section is open and we have location and activityId
        if (activeAccordion === "live-availability" && chooseLocation && activityId) {
            // Check if we have availabilities data
            const hasAvailabilities = availabilities && availabilities.length > 0;
            
            // If no availabilities, try to fetch them
            if (!hasAvailabilities) {
                console.log('🔵 Bing browser - No availabilities found, fetching...', {
                    chooseLocation,
                    activityId,
                    chooseFlightType: chooseFlightType?.type,
                    selectedVoucherType: selectedVoucherType?.title
                });
                
                // Use multiple retries with increasing delays for Bing browser
                const retryFetch = (attempt = 1) => {
                    const delay = attempt * 500; // 500ms, 1000ms, 1500ms...
                    setTimeout(() => {
                        if (chooseLocation && activityId) {
                            refetchAvailabilities();
                            // Retry up to 3 times
                            if (attempt < 3 && (!availabilities || availabilities.length === 0)) {
                                retryFetch(attempt + 1);
                            }
                        }
                    }, delay);
                };
                
                retryFetch(1);
            }
        }
    }, [activeAccordion, chooseLocation, activityId, availabilities, chooseFlightType, selectedVoucherType, refetchAvailabilities]);
    
    // Additional effect: For mobile Chrome browser, ensure availabilities are fetched when Live Availability section is open
    // This is critical for fixing the mobile Chrome bug where calendar shows empty dates on first load
    useEffect(() => {
        // Detect mobile Chrome browser specifically
        const isMobileChrome = (() => {
            try {
                const ua = navigator.userAgent;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                return isMobile && isChrome;
            } catch {
                return false;
            }
        })();
        
        if (!isMobileChrome) return;
        
        // Check if we're in Shopify flow
        const params = new URLSearchParams(location.search || '');
        const isShopifyFlow = params.get('source') === 'shopify';
        
        // Only run when Live Availability section is open and we have location and activityId
        // Only for Shopify flow (where the bug occurs)
        if (isShopifyFlow && activeAccordion === "live-availability" && chooseLocation && activityId) {
            // Check if we have availabilities data
            const hasAvailabilities = availabilities && availabilities.length > 0;
            
            // If no availabilities, try to fetch them aggressively
            if (!hasAvailabilities) {
                console.log('🔵 Mobile Chrome - No availabilities found in Shopify flow, fetching aggressively...', {
                    chooseLocation,
                    activityId,
                    chooseFlightType: chooseFlightType?.type,
                    selectedVoucherType: selectedVoucherType?.title,
                    activeAccordion
                });
                
                // Fetch immediately
                refetchAvailabilities();
                
                // Use multiple retries with increasing delays for mobile Chrome
                // More aggressive than Bing browser due to the specific bug
                const retryFetch = (attempt = 1) => {
                    const delay = attempt * 800; // 800ms, 1600ms, 2400ms...
                    setTimeout(() => {
                        if (chooseLocation && activityId && activeAccordion === "live-availability") {
                            console.log(`🔵 Mobile Chrome - Retrying availability fetch (attempt ${attempt + 1})`);
                            refetchAvailabilities();
                            // Retry up to 4 times for mobile Chrome (more than Bing)
                            if (attempt < 4) {
                                retryFetch(attempt + 1);
                            }
                        }
                    }, delay);
                };
                
                retryFetch(1);
            }
        }
    }, [activeAccordion, chooseLocation, activityId, availabilities, chooseFlightType, selectedVoucherType, refetchAvailabilities, location.search]);
    
    // Additional effect: Refetch availabilities when flight type is set from Shopify prefill
    useEffect(() => {
        // Only run for Shopify flow when flight type is set
        const params = new URLSearchParams(location.search || '');
        if (params.get('source') !== 'shopify') return;
        if (!chooseLocation || !activityId) return;
        if (!chooseFlightType?.type) return;
        
        // Detect mobile Chrome browser specifically
        const isMobileChrome = (() => {
            try {
                const ua = navigator.userAgent;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                return isMobile && isChrome;
            } catch {
                return false;
            }
        })();
        
        // Small delay to ensure state is settled
        // For mobile Chrome, use longer delay and multiple retries
        const delay = isMobileChrome ? 1200 : 800;
        const timer = setTimeout(() => {
            console.log('🔵 Shopify - Refetching availabilities after flight type set', {
                isMobileChrome
            });
            refetchAvailabilities();
            
            // For mobile Chrome, retry multiple times
            if (isMobileChrome) {
                for (let i = 1; i <= 2; i++) {
                    setTimeout(() => {
                        console.log(`🔵 Shopify Mobile Chrome - Retrying availability fetch after flight type (attempt ${i + 1})`);
                        refetchAvailabilities();
                    }, 1500 * i);
                }
            }
        }, delay);
        return () => clearTimeout(timer);
    }, [chooseFlightType?.type, chooseLocation, activityId, location.search, refetchAvailabilities]);

    // Additional effect: Refetch availabilities when voucher type is set from Shopify prefill
    useEffect(() => {
        // Only run for Shopify flow when voucher type is set
        const params = new URLSearchParams(location.search || '');
        if (params.get('source') !== 'shopify') return;
        if (!chooseLocation || !activityId) return;
        if (!selectedVoucherType?.title) return;
        
        // Detect mobile Chrome browser specifically
        const isMobileChrome = (() => {
            try {
                const ua = navigator.userAgent;
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                return isMobile && isChrome;
            } catch {
                return false;
            }
        })();
        
        // Small delay to ensure state is settled
        // For mobile Chrome, use longer delay and multiple retries
        const delay = isMobileChrome ? 1500 : 1000;
        const timer = setTimeout(() => {
            console.log('🔵 Shopify - Refetching availabilities after voucher type set:', {
                voucherType: selectedVoucherType.title,
                location: chooseLocation,
                activityId: activityId,
                flightType: chooseFlightType?.type,
                isMobileChrome
            });
            refetchAvailabilities();
            
            // For mobile Chrome, retry multiple times
            if (isMobileChrome) {
                for (let i = 1; i <= 2; i++) {
                    setTimeout(() => {
                        console.log(`🔵 Shopify Mobile Chrome - Retrying availability fetch after voucher type (attempt ${i + 1})`);
                        refetchAvailabilities();
                    }, 1500 * i);
                }
            }
        }, delay);
        return () => clearTimeout(timer);
    }, [selectedVoucherType?.title, chooseLocation, activityId, chooseFlightType?.type, location.search, refetchAvailabilities]);

    // Additional effect: Refetch availabilities when activityId is set from Shopify prefill
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        const source = params.get('source');
        if (source !== 'shopify') return;
        if (!chooseLocation || !activityId) return;
        
        // Small delay to ensure state is settled
        const timer = setTimeout(() => {
            console.log('🔵 Deep link - Refetching availabilities after activityId set:', {
                location: chooseLocation,
                activityId: activityId,
                flightType: chooseFlightType?.type,
                voucherType: selectedVoucherType?.title
            });
            refetchAvailabilities();
        }, 1200);
        return () => clearTimeout(timer);
    }, [activityId, chooseLocation, chooseFlightType?.type, selectedVoucherType?.title, location.search, refetchAvailabilities]);

    // Diagnostic logging: when Live Availability opens via Shopify deep link but appears empty
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search || '');
            const source = params.get('source');
            const isShopifyOrMerchant = source === 'shopify';
            const isVoucherTypeStart = params.get('startAt') === 'voucher-type';
            if (!isShopifyOrMerchant) return;
            if (activeAccordion !== 'live-availability') return;

            const snapshot = {
                reason: '[DeepLinkDebug] Live Availability state snapshot',
                url: window.location.href,
                isVoucherTypeStart,
                chooseLocation,
                activityId,
                flightType: chooseFlightType?.type,
                voucherType: selectedVoucherType?.title,
                availabilitiesCount: Array.isArray(availabilities) ? availabilities.length : 0,
                isLiveAvailabilityLoading,
                activitySelect,
                completedSections: Array.from(completedSections || []),
            };

            console.log(snapshot.reason, snapshot);

            if (!availabilities || availabilities.length === 0) {
                console.warn('[DeepLinkDebug] Live Availability EMPTY for deep link URL', {
                    url: window.location.href,
                    chooseLocation,
                    activityId,
                    flightType: chooseFlightType?.type,
                    voucherType: selectedVoucherType?.title,
                });
            }
        } catch (e) {
            console.warn('[DeepLinkDebug] Live Availability logging failed', e);
        }
    }, [
        location.search,
        activeAccordion,
        chooseLocation,
        activityId,
        chooseFlightType?.type,
        selectedVoucherType?.title,
        availabilities,
        isLiveAvailabilityLoading,
        activitySelect,
        completedSections,
    ]);

    // CRITICAL FIX: When activityId becomes available for Shopify deep link flow, immediately fetch availabilities
    // This ensures availabilities are fetched when all required state is ready
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        const source = params.get('source');
        const isShopifyOrMerchant = source === 'shopify';
        const isVoucherTypeStart = params.get('startAt') === 'voucher-type';
        
        // Only for deep-link flows
        if (!isShopifyOrMerchant) return;
        
        // Only when activityId is just set and we have required state
        if (!activityId || !chooseLocation) return;
        
        // For Shopify flow with startAt=voucher-type, we need location, experience, and voucher type
        // For other Shopify flows, we need location and experience at minimum
        const hasRequiredState = isVoucherTypeStart
            ? (chooseFlightType?.type && selectedVoucherType?.title) // Need all for voucher-type start
            : (chooseFlightType?.type); // Need at least experience for other flows
        
        // If Live Availability is open or will be opened soon, fetch immediately
        const shouldFetch = (activeAccordion === 'live-availability' || isVoucherTypeStart) && hasRequiredState;
        
        if (shouldFetch) {
            console.log('🔄 Deep link activityId Ready - Immediately fetching availabilities', {
                activityId,
                chooseLocation,
                chooseFlightType: chooseFlightType?.type,
                selectedVoucherType: selectedVoucherType?.title,
                activeAccordion,
                isVoucherTypeStart,
                hasRequiredState
            });
            
            // Small delay to ensure all state is settled
            const timer = setTimeout(() => {
                refetchAvailabilities();
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [activityId, chooseLocation, activeAccordion, location.search, refetchAvailabilities, chooseFlightType?.type, selectedVoucherType?.title]);

    // Monitor availabilities state changes for debugging
    useEffect(() => {
        if (activeAccordion === 'live-availability') {
        }
    }, [availabilities, activeAccordion]);

    // CRITICAL FIX: Retry availability fetch when Live Availability section is open but availabilities are empty (Shopify deep link first load issue)
    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        const source = params.get('source');
        const isShopifyOrMerchant = source === 'shopify';
        const isVoucherTypeStart = params.get('startAt') === 'voucher-type';
        
        // Only for voucher-type deep-link flows
        if (!isShopifyOrMerchant || !isVoucherTypeStart) return;
        
        // Only when Live Availability is active and availabilities are empty
        if (activeAccordion !== 'live-availability') return;
        if (availabilities && availabilities.length > 0) return;
        
        // Must have required state - for voucher-type start, we need voucher type too
        if (!chooseLocation || !chooseFlightType?.type) return;
        if (isVoucherTypeStart && !selectedVoucherType?.title) {
            console.log('🔄 Deep link First Load Fix - Waiting for voucher type to be set');
            return;
        }
        
        console.log('🔄 Deep link First Load Fix - Live Availability is open but empty, will retry with aggressive polling');
        
        let retryCount = 0;
        const maxRetries = 15; // Increased retries
        const retryInterval = 600; // Reduced interval for faster retries
        
        const retryFetch = () => {
            retryCount++;
            console.log(`🔄 Deep link First Load Fix - Retry #${retryCount}/${maxRetries}`, {
                activityId,
                chooseLocation,
                chooseFlightType: chooseFlightType?.type,
                selectedVoucherType: selectedVoucherType?.title,
                availabilitiesCount: availabilities?.length || 0
            });
            
            if (activityId) {
                refetchAvailabilities();
            } else {
                console.log('🔄 Deep link First Load Fix - activityId not ready yet, waiting...');
            }
        };
        
        // Start aggressive retry loop
        const intervalId = setInterval(() => {
            if (retryCount >= maxRetries) {
                console.log('🔄 Deep link First Load Fix - Max retries reached, stopping');
                clearInterval(intervalId);
                return;
            }
            
            // Stop if availabilities are now loaded
            if (availabilities && availabilities.length > 0) {
                console.log('🔄 Deep link First Load Fix - Availabilities loaded, stopping retries');
                clearInterval(intervalId);
                return;
            }
            
            // Stop if we're no longer on live-availability
            if (activeAccordion !== 'live-availability') {
                console.log('🔄 Deep link First Load Fix - No longer on live-availability, stopping');
                clearInterval(intervalId);
                return;
            }
            
            retryFetch();
        }, retryInterval);
        
        // Initial fetch
        retryFetch();
        
        return () => {
            clearInterval(intervalId);
        };
    }, [activeAccordion, availabilities, chooseLocation, chooseFlightType?.type, activityId, location.search, refetchAvailabilities, selectedVoucherType?.title]);

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
        // Check if we're in Shopify flow by URL params FIRST to prevent any reset
        let isShopifyFlow = false;
        try {
            const params = new URLSearchParams(location.search || '');
            isShopifyFlow = params.get('source') === 'shopify';
        } catch {}
        
        // Skip the mass-reset while Shopify prefill is running OR if we're in Shopify flow
        if (shopifyPrefillInProgress.current || isShopifyFlow) {
            if (isShopifyFlow) {
                console.log('🔄 ACTIVITY CHANGED - Skipping reset (Shopify flow)');
            }
            return;
        }

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
            // BUT: Skip this in Shopify flow to preserve state
            let isShopifyFlow = false;
            try {
                const params = new URLSearchParams(location.search || '');
                isShopifyFlow = params.get('source') === 'shopify';
            } catch {}
            
            if (!isShopifyFlow) {
            setCompletedSections(new Set());
        }
        }
    }, [activitySelect, location.search]);

    // Yeni: activitySelect değiştiğinde accordion'ı sıfırla ve otomatik olarak sıralamayı baştan başlat
    React.useEffect(() => {
        if (activitySelect !== null) {
            // Check URL params directly to avoid timing issues with shopifyStartAtVoucher state
            let shouldSkipAutoOpen = false;
            try {
                const params = new URLSearchParams(location.search || '');
                const source = params.get('source');
                const startAt = params.get('startAt');
                shouldSkipAutoOpen = source === 'shopify' && startAt === 'voucher-type';
            } catch {}
            
            // Skip auto-opening if we're coming from Shopify with startAt=voucher-type
            if (shopifyStartAtVoucher || shouldSkipAutoOpen) {
                console.log('🔄 ACTIVITY CHANGED - Skipping auto-open (Shopify startAt=voucher-type)');
                return;
            }
            
            console.log('🔄 ACTIVITY CHANGED - RESETTING EVERYTHING:', activitySelect);
            
            // Fresh start flag'ini set et
            setIsFreshStart(true);
            
            // Accordion'ı sıfırla
            setActiveAccordion(null);
            
            // Kısa delay sonra sıfırdan sıralamayı başlat
            setTimeout(() => {
                // Double-check: Skip auto-opening if we're coming from Shopify with startAt=voucher-type
                // This check is inside setTimeout because shopifyStartAtVoucher state might not be set yet
                let shouldSkipAutoOpenInTimeout = false;
                try {
                    const params = new URLSearchParams(location.search || '');
                    const source = params.get('source');
                    const startAt = params.get('startAt');
                    shouldSkipAutoOpenInTimeout = source === 'shopify' && startAt === 'voucher-type';
                } catch {}
                
                // Also check shopifyStartAtVoucher state (might be set by now)
                if (shopifyStartAtVoucher || shouldSkipAutoOpenInTimeout) {
                    console.log('🔄 ACTIVITY CHANGED - Skipping auto-open in setTimeout (Shopify startAt=voucher-type)');
                    return;
                }
                
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
                // BUT: Skip 'experience' section if we're in Shopify flow (startAt=voucher-type)
                if (sequence.length > 1) {
                    let firstSectionAfterActivity = sequence[1]; // activity'den sonraki ilk section
                    
                    // If first section is 'experience' and we're in Shopify flow, skip to next section
                    if (firstSectionAfterActivity === 'experience' && (shopifyStartAtVoucher || shouldSkipAutoOpenInTimeout)) {
                        // Find next section after experience
                        const experienceIndex = sequence.indexOf('experience');
                        if (experienceIndex !== -1 && sequence.length > experienceIndex + 1) {
                            firstSectionAfterActivity = sequence[experienceIndex + 1];
                            console.log('🔵 Shopify flow - Skipping experience section, opening next:', firstSectionAfterActivity);
                        } else {
                            // No next section, don't open anything
                            console.log('🔵 Shopify flow - Skipping experience section, no next section to open');
                            return;
                        }
                    }
                    
                    console.log('🔓 Auto-opening first section for new activity:', firstSectionAfterActivity);
                    setActiveAccordion(firstSectionAfterActivity);
                }
            }, 300); // State reset'in tamamlanması için biraz daha uzun delay
        }
    }, [activitySelect, shopifyStartAtVoucher, location.search]);

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
            

            // CRITICAL FIX: Don't force voucher-type if Live Availability is already open
            // This prevents closing Live Availability after it's been opened
            if (shopifyStartAtVoucher && selectedVoucherType && !shopifyVoucherForcedRef.current) {
                shopifyVoucherForcedRef.current = true;
                if (activeAccordion !== 'voucher-type' && activeAccordion !== 'live-availability') {
                    console.log('🔵 Shopify flow - forcing accordion to voucher-type (one-time)');
                    setActiveAccordion('voucher-type');
                }
                return;
            }
            
            // Force voucher-type accordion if shopifyStartAtVoucher is true, but ONLY on initial load (when activeAccordion is null)
            // Once user manually opens another accordion, don't force it back to voucher-type
            // Also check URL params directly to avoid timing issues
            let shouldForceVoucherType = shopifyStartAtVoucher;
            try {
                const params = new URLSearchParams(location.search || '');
                const source = params.get('source');
                const startAt = params.get('startAt');
                if (source === 'shopify' && startAt === 'voucher-type') {
                    shouldForceVoucherType = true;
                }
            } catch {}
            
            // Only force voucher-type on initial load (when activeAccordion is null or undefined)
            // This allows users to manually open Live Availability after voucher type is selected
            // CRITICAL FIX: Don't force if Live Availability is already open
            if (shouldForceVoucherType && (activeAccordion === null || activeAccordion === undefined) && !selectedVoucherType && activeAccordion !== 'live-availability') {
                console.log('🔵 Shopify flow - forcing accordion to voucher-type (initial load only)');
                setActiveAccordion('voucher-type');
                return;
            }

            // Check URL params directly to avoid timing issues
            let shouldSkipAutoOpen = false;
            try {
                const params = new URLSearchParams(location.search || '');
                const source = params.get('source');
                const startAt = params.get('startAt');
                shouldSkipAutoOpen = source === 'shopify' && startAt === 'voucher-type';
            } catch {}

            // Eğer mevcut açık accordion yeni sıralamada yoksa, sıradaki accordion'ı aç
            // BUT: Skip this if we're coming from Shopify with startAt=voucher-type
            // Also skip if voucher-type is currently open and we're in Shopify flow (to prevent auto-opening other accordions)
            const isVoucherTypeOpenInShopifyFlow = activeAccordion === 'voucher-type' && (shopifyStartAtVoucher || shouldSkipAutoOpen);
            if (!sequence.includes(activeAccordion) && !shopifyStartAtVoucher && !shouldSkipAutoOpen && !isVoucherTypeOpenInShopifyFlow) {
                console.log('❌ Current accordion not in new sequence, finding next valid accordion');
                
                // Tamamlanmış section'ları kontrol et
                const completedSections = [];
                // For Redeem Voucher: activity only complete when voucher is validated (green tick)
                if (activitySelect) {
                    if (activitySelect === 'Redeem Voucher') {
                        if (voucherStatus === 'valid') completedSections.push('activity');
                    } else {
                        completedSections.push('activity');
                    }
                }
                if (chooseLocation) completedSections.push('location');
                // For experience: check chooseFlightType OR if we're in Shopify flow with experience param
                const hasExperienceFromShopify = (() => {
                    try {
                        const params = new URLSearchParams(location.search || '');
                        return params.get('source') === 'shopify' && params.get('experience');
                    } catch {
                        return false;
                    }
                })();
                const experienceCompleted = chooseFlightType?.type || hasExperienceFromShopify;
                if (experienceCompleted) {
                    completedSections.push('experience');
                }
                if (selectedVoucherType) completedSections.push('voucher-type');
                if (selectedDate && selectedTime) completedSections.push('live-availability');
                // Use proper passenger info validation based on activity type
                const passengerComplete = isGiftVoucher ? isBuyGiftPassengerComplete : isPassengerInfoComplete;
                if (passengerComplete) completedSections.push('passenger-info');
                // Additional Information is optional unless API marks specific questions required
                if (isAdditionalInfoValid(additionalInfo)) completedSections.push('additional-info');
                if (recipientDetails?.name && recipientDetails?.email && recipientDetails?.phone && recipientDetails?.date) completedSections.push('recipient-details');
                if (chooseAddOn && chooseAddOn.length > 0) completedSections.push('add-on');
                
                // Sıradaki tamamlanmamış section'ı bul
                // BUT: Skip 'experience' section if we're in Shopify flow (startAt=voucher-type)
                const nextSection = sequence.find(section => {
                    if (!completedSections.includes(section)) {
                        // Skip experience section in Shopify flow
                        if (section === 'experience' && (shopifyStartAtVoucher || shouldSkipAutoOpen)) {
                            return false;
                        }
                        return true;
                    }
                    return false;
                });
                
                if (nextSection) {
                    console.log('🔓 Opening next valid section:', nextSection);
                    
                    // For Shopify flow, if opening Live Availability, ensure state is ready and trigger fetch
                    if (nextSection === 'live-availability' && (shopifyStartAtVoucher || shouldSkipAutoOpen)) {
                        // Check if we have required state (location, activityId, and experience)
                        const hasRequiredState = chooseLocation && activityId && chooseFlightType?.type;
                        if (hasRequiredState) {
                            console.log('🔵 Shopify flow - All state ready, opening Live Availability', {
                                chooseLocation,
                                activityId,
                                chooseFlightType: chooseFlightType?.type
                            });
                    setActiveAccordion(nextSection);
                            // Trigger availability fetch after a short delay to ensure state is settled
                            setTimeout(() => {
                                console.log('🔵 Shopify flow - Triggering availability fetch after opening Live Availability');
                                refetchAvailabilities();
                            }, 600);
                        } else {
                            console.log('🔵 Shopify flow - Waiting for state to be ready before opening Live Availability', {
                                chooseLocation: !!chooseLocation,
                                activityId: !!activityId,
                                chooseFlightType: !!chooseFlightType?.type
                            });
                            // Wait a bit longer for state to be set
                            setTimeout(() => {
                                const hasRequiredStateDelayed = chooseLocation && activityId && chooseFlightType?.type;
                                if (hasRequiredStateDelayed) {
                                    console.log('🔵 Shopify flow - State ready (delayed), opening Live Availability');
                                    setActiveAccordion(nextSection);
                                    setTimeout(() => {
                                        console.log('🔵 Shopify flow - Triggering availability fetch after opening Live Availability (delayed)');
                                        refetchAvailabilities();
                                    }, 600);
                                } else {
                                    console.log('🔵 Shopify flow - State still not ready, will retry once more');
                                    // One more retry
                                    setTimeout(() => {
                                        if (chooseLocation && activityId && chooseFlightType?.type) {
                                            setActiveAccordion(nextSection);
                                            setTimeout(() => {
                                                refetchAvailabilities();
                                            }, 600);
                                        }
                                    }, 1500);
                                }
                            }, 1200);
                        }
                    } else {
                        setActiveAccordion(nextSection);
                    }
                } else {
                    console.log('✅ All sections completed, closing accordion');
                    setActiveAccordion(null);
                }
            } else if (!sequence.includes(activeAccordion) && (shopifyStartAtVoucher || shouldSkipAutoOpen || isVoucherTypeOpenInShopifyFlow)) {
                console.log('🔵 Skipping next section auto-open (Shopify startAt=voucher-type or voucher-type is open)');
            }
        }
    }, [chooseLocation, chooseFlightType, selectedVoucherType, selectedDate, selectedTime, passengerData, additionalInfo, recipientDetails, chooseAddOn, shopifyStartAtVoucher, activeAccordion, location.search]);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname.toLowerCase();
            setIsCustomerPortal(path.includes('customerportal'));
        }
        try {
            const params = new URLSearchParams(location.search || '');
            const source = params.get('source');
            const startAt = params.get('startAt');
            const shouldStartAtVoucher = startAt === 'voucher-type' && source === 'shopify';
            setShopifyStartAtVoucher(shouldStartAtVoucher);
        } catch {}
    }, [location.pathname, location.search]);

    // Support deep links that should start directly on the Flight Voucher journey
    useEffect(() => {
        if (activityDeepLinkHandledRef.current) return;

        const params = new URLSearchParams(location.search || '');

        // Do not override the specialised Shopify flow
        if (params.get('source') === 'shopify') return;

        const journeyParam = (params.get('journey') || params.get('activity') || '').toLowerCase();
        if (journeyParam === 'flight-voucher' || journeyParam === 'buy-flight-voucher' || journeyParam === 'flightvoucher') {
            activityDeepLinkHandledRef.current = true;
            setActivitySelect('Flight Voucher');
            setCompletedSections(new Set(['activity']));
        } else if (
            journeyParam === 'buy-gift-voucher' ||
            journeyParam === 'gift-voucher' ||
            journeyParam === 'buy-gift'
        ) {
            activityDeepLinkHandledRef.current = true;
            setActivitySelect('Buy Gift');
            setCompletedSections(new Set(['activity']));
        }
    }, [location.search]);

    // Google Merchant: When coming from Google Merchant product links (startAt=voucher-type, voucherTitle, location),
    // ensure NO section is pre-selected. User must explicitly choose "What would you like to do?"
    useEffect(() => {
        if (googleMerchantClearHandledRef.current) return;

        try {
            const params = new URLSearchParams(location.search || '');
            const source = params.get('source');
            const startAt = params.get('startAt');
            const voucherTitle = params.get('voucherTitle');

            // Google Merchant links use startAt=voucher-type and voucherTitle but do NOT have source=shopify
            const isGoogleMerchantStyleUrl =
                source !== 'shopify' &&
                (startAt === 'voucher-type' || !!voucherTitle);

            if (isGoogleMerchantStyleUrl) {
                googleMerchantClearHandledRef.current = true;
                setActivitySelect(null);
                setCompletedSections(new Set());
                setActiveAccordion(null);
                setChooseLocation(null);
                setChooseFlightType({ type: '', passengerCount: '', price: '' });
                setSelectedVoucherType(null);
            }
        } catch (e) {
            console.warn('[GoogleMerchant] Clear pre-selection check failed', e);
        }
    }, [location.search]);

    // Ensure Experience step shows as completed in progress when coming from Shopify
    // and the experience has been derived/selected.
    useEffect(() => {
        // Check if we're in Shopify flow
        let isShopifyFlow = false;
        try {
            const params = new URLSearchParams(location.search || '');
            isShopifyFlow = params.get('source') === 'shopify';
        } catch {}
        
        if (!isShopifyFlow && !shopifyStartAtVoucher) return;
        if (!chooseFlightType?.type) return;

        console.log('🔵 Shopify flow - Ensuring experience is marked as completed:', chooseFlightType.type);
        setCompletedSections(prev => {
            const next = new Set(prev);
            if (!next.has('experience')) {
                next.add('experience');
                console.log('🔵 Shopify flow - Added experience to completed sections');
            }
            return next;
        });
    }, [shopifyStartAtVoucher, chooseFlightType?.type, location.search]);

    // Prefill flow when redirected from Shopify voucher selection
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            const source = params.get('source');
            const qpLocation = params.get('location');
            const qpVoucherTitle = params.get('voucherTitle');
            const qpPassengers = parseInt(params.get('passengers') || '2', 10);
            const qpExperience = params.get('experience');
            const qpStartAt = params.get('startAt');
            const qpWeatherRefundable = params.get('weatherRefundable') === 'true';

            if (source !== 'shopify') return;

            // Prevent the activity-change reset from wiping prefilled values
            shopifyPrefillInProgress.current = true;


            console.log('🔵 Deep link prefill - URL params:', {
                location: qpLocation,
                voucherTitle: qpVoucherTitle,
                passengers: qpPassengers,
                experience: qpExperience,
                startAt: qpStartAt,
                weatherRefundable: qpWeatherRefundable
            });

            // Derive experience from voucher title if not provided
            let derivedExperience = qpExperience;
            if (!derivedExperience && qpVoucherTitle) {
                const titleLower = qpVoucherTitle.toLowerCase();
                if (titleLower.includes('private charter') || titleLower.includes('proposal')) {
                    derivedExperience = 'Private Charter';
                } else {
                    // Flexible Weekday, Weekday Morning, Any Day Flight are all Shared Flight
                    derivedExperience = 'Shared Flight';
                }
            }

            console.log('🔵 Shopify prefill - Derived experience:', derivedExperience);

            // (debug instrumentation removed)

            // Use Book Flight flow by default for Shopify deep-link
            // NOTE: activitySelect values use internal labels ('Book Flight', 'Flight Voucher', etc.),
            // while the UI shows 'Book Flight Date' as displayLabel.
            setActivitySelect('Book Flight');

            // Mark prerequisite sections as completed so Voucher Type accordion can open
            setCompletedSections(prev => {
                const next = new Set(prev);
                next.add('activity');
                if (qpLocation) next.add('location');
                if (derivedExperience) next.add('experience');
                return next;
            });

            // Preselect location (e.g. Somerset, Devon, Bath)
            // Trim and ensure proper capitalization to match location names from API
            if (qpLocation) {
                const trimmedLocation = qpLocation.trim();
                console.log('🔵 Shopify prefill - Setting location:', trimmedLocation);
                // Set location immediately
                setChooseLocation(trimmedLocation);
                
                // CRITICAL FIX: Immediately fetch activityId when location is set from URL
                // Don't wait for DOM click event - this eliminates the 600ms delay and DOM dependency
                (async () => {
                    try {
                        const activityResponse = await axios.post(`${API_BASE_URL}/api/getActivityId`, {
                            location: trimmedLocation
                        });
                        
                        if (activityResponse.status === 200 && activityResponse.data.success) {
                            const activity = activityResponse.data.activity;
                            const fetchedActivityId = activity?.id || '';
                            console.log('🔵 Shopify prefill - activityId fetched immediately:', fetchedActivityId);
                            setActivityId(fetchedActivityId);
                            setSelectedActivity(activity ? [activity] : []);
                        } else {
                            console.warn('🔵 Shopify prefill - Failed to fetch activityId');
                        }
                    } catch (error) {
                        console.error('🔵 Shopify prefill - Error fetching activityId:', error);
                    }
                })();
                
                // Also trigger location selection in LocationSection component for UI consistency
                // This ensures the location card is visually selected
                setTimeout(() => {
                    // Find and click the location card to trigger confirmLocation
                    const locationCards = document.querySelectorAll('.location_data');
                    locationCards.forEach(card => {
                        const locationName = card.querySelector('h3')?.textContent?.trim();
                        if (locationName === trimmedLocation) {
                            console.log('🔵 Shopify prefill - Clicking location card for UI consistency:', locationName);
                            const clickEvent = new MouseEvent('click', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            card.dispatchEvent(clickEvent);
                        }
                    });
                }, 600);
            }

            // Preselect experience and passenger count
            // OPTIMIZATION: Set immediately instead of waiting 1000ms - state is already available
            if (derivedExperience || qpPassengers) {
                console.log('🔵 Shopify prefill - Setting flight type immediately:', {
                    type: derivedExperience,
                    passengerCount: qpPassengers > 0 ? String(qpPassengers) : '2'
                });
                setChooseFlightType({
                    type: derivedExperience || 'Shared Flight',
                    passengerCount: qpPassengers > 0 ? String(qpPassengers) : '2',
                    price: ''
                });
                
                // Ensure experience is marked as completed immediately
                setCompletedSections(prev => {
                    const next = new Set(prev);
                    next.add('experience');
                    console.log('🔵 Shopify prefill - Marked experience as completed');
                    return next;
                });
                
                // OPTIMIZATION: Refetch availabilities immediately when state is ready (no 500ms delay)
                // Use a small delay only to ensure state updates are processed
                setTimeout(() => {
                    if (qpLocation && activityId && derivedExperience) {
                        // For voucher-type start, wait for voucher type to be set too
                        if (qpStartAt === 'voucher-type' && !qpVoucherTitle) {
                            console.log('🔵 Shopify prefill - Waiting for voucher type before refetching (startAt=voucher-type)');
                        } else {
                            console.log('🔵 Shopify prefill - Refetching availabilities immediately after flight type set');
                            refetchAvailabilities();
                        }
                    }
                }, 50); // Minimal delay for state updates
                
                // Trigger experience selection in ExperienceSection component
                setTimeout(() => {
                        // Find experience cards by text content
                        const experienceCards = document.querySelectorAll('.experience-card, [class*="experience"]');
                        experienceCards.forEach(card => {
                            const cardText = card.textContent || '';
                            // Check if card contains the experience type
                            if (derivedExperience === 'Shared Flight' && (cardText.includes('Shared') || cardText.includes('Shared Flight'))) {
                                console.log('🔵 Shopify prefill - Clicking Shared Flight card');
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                card.dispatchEvent(clickEvent);
                            } else if (derivedExperience === 'Private Charter' && (cardText.includes('Private') || cardText.includes('Private Charter'))) {
                                console.log('🔵 Shopify prefill - Clicking Private Charter card');
                                const clickEvent = new MouseEvent('click', {
                                    bubbles: true,
                                    cancelable: true,
                                    view: window
                                });
                                card.dispatchEvent(clickEvent);
                            }
                        });
                    }, 300);
                }

            // Prefill weather refundable in passengerData if provided
            if (qpWeatherRefundable) {
                console.log('🔵 Shopify prefill - Setting weather refundable in passengerData');
                setPassengerData(prev => {
                    if (Array.isArray(prev) && prev.length > 0) {
                        return prev.map(p => ({ ...p, weatherRefund: true }));
                    }
                    return [{ firstName: '', lastName: '', weight: '', weatherRefund: true }];
                });
            }

            // Prefill voucher type selection
            // OPTIMIZATION: Set immediately instead of waiting 1500ms - state is already available
            if (qpVoucherTitle) {
                    console.log('🔵 Shopify prefill - Setting voucher type:', {
                        title: qpVoucherTitle,
                        quantity: qpPassengers > 0 ? qpPassengers : 2,
                        weatherRefundable: qpWeatherRefundable
                    });
                    setSelectedVoucherType({
                        title: qpVoucherTitle,
                        quantity: qpPassengers > 0 ? qpPassengers : 2,
                        price: 0,
                        weatherRefundable: qpWeatherRefundable
                    });
                    
                    // Trigger voucher type selection in VoucherType component
                    // OPTIMIZATION: Use minimal delay for DOM interaction
                    setTimeout(() => {
                        // Find voucher cards by title text
                        const voucherCards = document.querySelectorAll('.voucher-card, [class*="voucher"]');
                        voucherCards.forEach(card => {
                            const cardTitle = card.querySelector('h3, h4, .voucher-title, [class*="title"]')?.textContent?.trim();
                            // Decode URL-encoded title (e.g., "Flexible+Weekday" -> "Flexible Weekday")
                            const decodedTitle = decodeURIComponent(qpVoucherTitle.replace(/\+/g, ' '));
                            if (cardTitle && (cardTitle === decodedTitle || cardTitle === qpVoucherTitle)) {
                                console.log('🔵 Shopify prefill - Clicking voucher card:', cardTitle);
                                const selectButton = card.querySelector('.voucher-card-select-btn, button, [class*="select"]');
                                if (selectButton) {
                                    const clickEvent = new MouseEvent('click', {
                                        bubbles: true,
                                        cancelable: true,
                                        view: window
                                    });
                                    selectButton.dispatchEvent(clickEvent);
                                } else {
                                    card.dispatchEvent(new MouseEvent('click', {
                                        bubbles: true,
                                        cancelable: true,
                                        view: window
                                    }));
                                }
                            }
                        });
                        
                        // OPTIMIZATION: Refetch immediately after voucher type is set (no 600ms delay)
                        setTimeout(() => {
                            if (qpLocation && activityId && derivedExperience && qpVoucherTitle) {
                                console.log('🔵 Shopify prefill - All state ready, refetching availabilities with filters');
                                refetchAvailabilities();
                            }
                        }, 100); // Minimal delay for state updates
                    }, 100); // Minimal delay for DOM interaction
                }

            // Open accordions in sequence with delays to ensure components are mounted and state is set
            // If startAt=voucher-type, skip location and experience accordions
            if (qpStartAt !== 'voucher-type') {
                setTimeout(() => {
                    // Open location accordion briefly to show selection
                    if (qpLocation) {
                        console.log('🔵 Shopify prefill - Opening location accordion');
                        setActiveAccordion('location');
                    }
                }, 400);
            }

            setTimeout(() => {
                // Open experience accordion only if NOT starting at voucher-type
                // Also check shopifyStartAtVoucher state to ensure we don't open experience in Shopify flow
                if (derivedExperience && qpStartAt !== 'voucher-type' && !shopifyStartAtVoucher) {
                    console.log('🔵 Shopify prefill - Opening experience accordion');
                    setActiveAccordion('experience');
                } else if (qpStartAt === 'voucher-type' || shopifyStartAtVoucher) {
                    // If starting at voucher-type, skip experience accordion and go directly to voucher-type
                    console.log('🔵 Shopify prefill - Skipping experience accordion, going directly to voucher-type');
                }
            }, 1000);

            // OPTIMIZATION: Open accordion immediately instead of waiting 1800ms
            // Use minimal delay only to ensure state updates are processed
            setTimeout(() => {
                // Finally, open voucher-type accordion (this is the main target)
                // Priority: if startAt=voucher-type, open it immediately; otherwise open if voucherTitle exists
                if (qpStartAt === 'voucher-type') {
                    console.log('🔵 Shopify prefill - Opening voucher-type accordion (startAt=voucher-type)');
                    setActiveAccordion('voucher-type');
                    
                    // Scroll to voucher type section
                    setTimeout(() => {
                        const voucherSection = document.getElementById('voucher-type');
                        if (voucherSection) {
                            voucherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                    
                    // OPTIMIZATION: Check state readiness immediately and open Live Availability when ready
                    // Instead of waiting 6000ms, poll for state readiness with shorter intervals
                    const checkAndOpenLiveAvailability = () => {
                        // Check if all required state is ready AND all accordions/terms are loaded
                        const hasRequiredState = qpLocation && activityId && derivedExperience && qpVoucherTitle;
                        const termsReady = voucherTermsLoadedRef.current || !voucherTermsLoading;
                        const accordionsReady = !accordionLoadingStates.isAccordionLoading && accordionLoadedRef.current;
                        
                        if (hasRequiredState && termsReady && accordionsReady) {
                            console.log('🔵 Shopify prefill - All state ready, opening Live Availability immediately');
                            // Detect mobile Chrome browser specifically
                            const isMobileChrome = (() => {
                                try {
                                    const ua = navigator.userAgent;
                                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                                    const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
                                    return isMobile && isChrome;
                                } catch {
                                    return false;
                                }
                            })();
                            
                            console.log('🔵 Shopify prefill - All state ready, preparing to open Live Availability section', {
                                isMobileChrome,
                                location: qpLocation,
                                activityId,
                                experience: derivedExperience,
                                voucherType: qpVoucherTitle
                            });
                            
                            // For mobile Chrome: Fetch availabilities FIRST, wait for them to load, THEN open section
                            if (isMobileChrome) {
                                console.log('🔵 Mobile Chrome - Fetching availabilities BEFORE opening Live Availability section');
                                
                                // Set loading state before fetching
                                setIsLiveAvailabilityLoadingSync(true);
                                
                                // Fetch availabilities and wait for the promise to resolve
                                const fetchAndWait = async () => {
                                    try {
                                        // First fetch attempt
                                        let fetchedData = await refetchAvailabilities();
                                        
                                        // If no data, retry up to 3 times with increasing delays
                                        let retryCount = 0;
                                        const maxRetries = 3;
                                        
                                        while ((!fetchedData || fetchedData.length === 0) && retryCount < maxRetries) {
                                            retryCount++;
                                            const delay = retryCount * 800; // 800ms, 1600ms, 2400ms
                                            console.log(`🔵 Mobile Chrome - Retry ${retryCount}/${maxRetries} after ${delay}ms`);
                                            
                                            await new Promise(resolve => setTimeout(resolve, delay));
                                            fetchedData = await refetchAvailabilities();
                                        }
                                        
                                        if (fetchedData && fetchedData.length > 0) {
                                            console.log('🔵 Mobile Chrome - Availabilities loaded, opening Live Availability section', {
                                                count: fetchedData.length
                                            });
                                        } else {
                                            console.log('🔵 Mobile Chrome - No availabilities after retries, opening section anyway');
                                        }
                                        
                                        // Open section after availabilities are loaded (or after retries)
                                        setActiveAccordion('live-availability');
                                        
                                        // Final refetch to ensure we have the latest data
                                        setTimeout(() => {
                                            refetchAvailabilities();
                                        }, 200);
                                    } catch (error) {
                                        console.error('🔵 Mobile Chrome - Error fetching availabilities:', error);
                                        // Open section anyway to prevent blocking
                                        setActiveAccordion('live-availability');
                                    }
                                };
                                
                                fetchAndWait();
                            } else {
                                // OPTIMIZATION: For non-mobile Chrome, open immediately when state is ready (no 2500ms delay)
                                console.log('🔵 Shopify prefill - Opening Live Availability section immediately (non-mobile Chrome)');
                                setIsLiveAvailabilityLoadingSync(true);
                                setActiveAccordion('live-availability');
                                
                                // Final refetch with all state ready
                                setTimeout(() => {
                                    refetchAvailabilities();
                                    setTimeout(() => setIsLiveAvailabilityLoadingSync(false), 500);
                                }, 100); // Minimal delay
                            }
                        } else {
                            console.log('🔵 Shopify prefill - Not all state/accordions/terms ready yet, polling with shorter intervals', {
                                location: qpLocation,
                                activityId,
                                experience: derivedExperience,
                                voucherType: qpVoucherTitle,
                                termsReady,
                                accordionsReady
                            });
                            
                            // OPTIMIZATION: Poll with shorter intervals (200ms) instead of waiting 3000ms
                            let pollAttempt = 0;
                            const maxPollAttempts = 20; // Max 4 seconds (20 * 200ms)
                            const pollInterval = 200;
                            
                            const pollForReadiness = () => {
                                pollAttempt++;
                                const retryHasRequiredState = qpLocation && activityId && derivedExperience && qpVoucherTitle;
                                const retryTermsReady = voucherTermsLoadedRef.current || !voucherTermsLoading;
                                const retryAccordionsReady = !accordionLoadingStates.isAccordionLoading && accordionLoadedRef.current;
                                
                                if (retryHasRequiredState && retryTermsReady && retryAccordionsReady) {
                                    console.log('🔵 Shopify prefill - State ready after polling, opening Live Availability');
                                    setIsLiveAvailabilityLoadingSync(true);
                                    setActiveAccordion('live-availability');
                                    setTimeout(() => {
                                        refetchAvailabilities();
                                        setIsLiveAvailabilityLoadingSync(false);
                                    }, 100);
                                } else if (pollAttempt < maxPollAttempts) {
                                    setTimeout(pollForReadiness, pollInterval);
                                } else {
                                    console.log('🔵 Shopify prefill - Polling exhausted, opening anyway to prevent blocking');
                                    setActiveAccordion('live-availability');
                                    setIsLiveAvailabilityLoadingSync(true);
                                    setTimeout(() => {
                                        refetchAvailabilities();
                                        setIsLiveAvailabilityLoadingSync(false);
                                    }, 100);
                                }
                            };
                            
                            setTimeout(pollForReadiness, pollInterval);
                        }
                    };
                    
                    // Start checking immediately instead of waiting 6000ms
                    setTimeout(checkAndOpenLiveAvailability, 200); // Small delay to ensure state updates are processed
                } else if (qpVoucherTitle) {
                    console.log('🔵 Shopify prefill - Opening voucher-type accordion (voucherTitle provided)');
                    setActiveAccordion('voucher-type');
                    // Scroll to voucher type section
                    setTimeout(() => {
                        const voucherSection = document.getElementById('voucher-type');
                        if (voucherSection) {
                            voucherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 100);
                }
            }, 200); // OPTIMIZATION: Minimal delay instead of 1800ms/1500ms

            // End of prefill - allow normal resets after a short delay to ensure state has been set
            setTimeout(() => {
                shopifyPrefillInProgress.current = false;
            }, 2000);
        } catch (e) {
            console.error('Error pre-filling booking flow from Shopify params:', e);
            shopifyPrefillInProgress.current = false;
        }
    }, [location.search]);

    const scrollToPortalSection = useCallback((sectionId) => {
        if (typeof window === 'undefined') return;
        const element = document.getElementById(sectionId);
        if (!element) return;
        const offset = isMobile ? 80 : 10;
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
                            // Fire Google Ads conversion (webhook ran first, so frontend must fire gtag for Tag Assistant)
                            const convData = statusResp.data?.conversion_data;
                            if (convData) {
                                trackPurchaseCompleted(convData);
                            }
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
                        // Email debug log for Buy Flight Voucher (Flight Voucher confirmation email expected)
                        console.log('✅ [EmailDebug] Backend createBookingFromSession success', {
                            type,
                            voucher_type: response.data.voucher_type,
                            book_flight: response.data.book_flight,
                            activitySelect,
                            chooseFlightType: chooseFlightType?.type,
                            voucherCode: finalVoucherCode,
                            session_id,
                            voucher_id: response.data.id,
                            customer_email: response.data.customer_email,
                            customer_name: response.data.customer_name
                        });
                        
                        // Check if this is a Flight Voucher transaction
                        const isFlightVoucher = (type === 'voucher' && 
                            (response.data.voucher_type === 'Buy Flight Voucher' || 
                             response.data.voucher_type === 'Flight Voucher' ||
                             (response.data.book_flight && response.data.book_flight.toLowerCase().includes('flight voucher'))));
                        
                        if (isFlightVoucher) {
                            console.log('📧 [EmailDebug] FLIGHT VOUCHER DETECTED - Email should be sent automatically by backend');
                            console.log('📧 [EmailDebug] Check backend logs for email sending status');
                            console.log('📧 [EmailDebug] Backend should log: [sendAutomaticFlightVoucherConfirmationEmail] or [WEBHOOK] or [FALLBACK]');
                        } else {
                            console.log('ℹ️ [EmailDebug] Not a Flight Voucher transaction, email sending may not apply');
                        }
                            
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

                            // Google Ads: GA_Purchase_Completed (client-side redundancy)
                            const funnelType = type === 'booking' ? 'booking' : ((response.data.voucher_type || response.data.book_flight || '').toLowerCase().includes('gift') ? 'gift' : 'voucher');
                            const experienceType = (response.data.experience_type || response.data.chooseFlightType?.type || '').toLowerCase().includes('private') ? 'private' : 'shared';
                            const productType = response.data.voucher_type_detail || response.data.voucher_type || '';
                            trackPurchaseCompleted({
                                transaction_id: session_id,
                                value: response.data.paid_amount || 0,
                                currency: 'GBP',
                                funnel_type: funnelType,
                                experience_type: experienceType,
                                product_type: productType
                            });
                        } else {
                        console.warn('[EmailDebug] Backend did not return success; email may not have been triggered', {
                            type,
                            activitySelect,
                            chooseFlightType: chooseFlightType?.type,
                            session_id
                        });
                            console.warn('Payment succeeded but backend did not return success. Skipping alert because entry is already created.');
                        }
                    } catch (error) {
                        // If the server returns 400 but the session becomes processed shortly after,
                        // poll the status endpoint before logging the error.
                        try {
                            for (let i = 0; i < 8; i++) {
                                const s = await axios.get(`${API_BASE_URL}/api/session-status`, { params: { session_id } });
                                if (s.data?.processed) {
                                    console.log('[EmailDebug] Session processed after fallback error; email should have been sent by backend', {
                                        session_id,
                                        type,
                                        activitySelect,
                                        chooseFlightType: chooseFlightType?.type
                                    });
                                    console.log('Session processed after fallback error; suppressing error.');
                                    localStorage.setItem(`fab_payment_processed_${session_id}`, '1');
                                    return;
                                }
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        } catch (statusCheckErr) {
                            // ignore
                        }
                        console.error('[EmailDebug] Error creating from session; email likely not sent', {
                            session_id,
                            type,
                            activitySelect,
                            chooseFlightType: chooseFlightType?.type,
                            error: error?.response?.data || error?.message
                        });
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
                                <a
                                    href="https://flyawayballooning.com/"
                                    onClick={e => {
                                        e.preventDefault();
                                        try {
                                            sessionStorage.clear();
                                            localStorage.clear();
                                        } catch (err) {
                                            console.warn('Failed to clear storage on logo click:', err);
                                        }
                                        window.location.href = 'https://flyawayballooning.com/';
                                    }}
                                    style={{ display: 'inline-block' }}
                                >
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
                    {/* Progress Bar - desktop: sticky at top, mobile: fixed above summary bar */}
                    {activitySelect && !isMobile && (
                        <div style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 900,
                            padding: '8px 0',
                            marginBottom: '4px',
                            backgroundColor: '#f5f7fb',
                            width: '100%',
                            maxWidth: '100%',
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
                                                    onTermsLoadingChange={(loading) => {
                                                        setVoucherTermsLoading(loading);
                                                        if (!loading) {
                                                            voucherTermsLoadedRef.current = true;
                                                            console.log('[ShopifyDebug] Terms and Conditions loaded');
                                                        }
                                                    }}
                                                    onAccordionLoadingChange={(states) => {
                                                        setAccordionLoadingStates(states);
                                                    }}
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
                                                onLoadingStateChange={setIsLiveAvailabilityLoadingSync}
                                                onCurrentDateChange={handleCalendarDateChange}
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
                                                onLoadingStateChange={setIsLiveAvailabilityLoadingSync}
                                                onCurrentDateChange={handleCalendarDateChange}
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
                                                    onTermsLoadingChange={(loading) => {
                                                        setVoucherTermsLoading(loading);
                                                        if (!loading) {
                                                            voucherTermsLoadedRef.current = true;
                                                            console.log('[ShopifyDebug] Terms and Conditions loaded');
                                                        }
                                                    }}
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
                                                    onTermsLoadingChange={(loading) => {
                                                        setVoucherTermsLoading(loading);
                                                        if (!loading) {
                                                            voucherTermsLoadedRef.current = true;
                                                            console.log('[ShopifyDebug] Terms and Conditions loaded');
                                                        }
                                                    }}
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
                                                    onLoadingStateChange={setIsLiveAvailabilityLoadingSync}
                                                    onCurrentDateChange={handleCalendarDateChange}
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
            
            {/* Progress Bar - Mobile: fixed above summary bar */}
            {activitySelect && isMobile && (
                <div style={{
                    position: 'fixed',
                    bottom: '65px', // Above summary-sticky (which is typically 56px height)
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    padding: '8px 12px',
                    backgroundColor: '#f5f7fb',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderTop: '1px solid #e5e7eb'
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
                onClose={() => {
                    setSuccessModalOpen(false);
                    setSuccessModalData(null);
                    // Redirect to main website after closing the modal
                    window.location.href = 'https://flyawayballooning.com/';
                }}
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
                            // Redirect to main website after closing the modal
                            window.location.href = 'https://flyawayballooning.com/';
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
