import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import Accordion from '../Common/Accordion';
import axios from 'axios';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import weekdayMorningImg from '../../../assets/images/category1.jpeg';
import flexibleWeekdayImg from '../../../assets/images/category2.jpeg';
import anyDayFlightImg from '../../../assets/images/category3.jpg';
import config from '../../../config';
import { BsInfoCircle } from 'react-icons/bs';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { useLocation } from 'react-router-dom';

// Add CSS animations for slide effects
const slideAnimations = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
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
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
`;

// Inject the CSS animations
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = slideAnimations;
    document.head.appendChild(style);
}

// Custom scrollbar styles
const scrollbarStyles = `
    .voucher-type-scroll-outer {
        overflow-x: auto;
        width: 100%;
        max-width: 100%;
        scrollbar-width: thin;
        scrollbar-color: #666 #f1f1f1;
        -webkit-overflow-scrolling: touch;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar {
        height: 12px;
        width: 12px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
        margin: 0 2px;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
        background: #666;
        border-radius: 6px;
        border: 2px solid #f1f1f1;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-thumb:hover {
        background: #444;
    }
    .voucher-type-scroll-outer::-webkit-scrollbar-corner {
        background: #f1f1f1;
    }
    
    /* Mobile-specific scrollbar styles */
    @media (max-width: 768px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 6px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-track {
            background: #e0e0e0;
            margin: 0 1px;
        }
        .voucher-type-scroll-outer::-webkit-scrollbar-thumb {
            background: #999;
            border: 1px solid #e0e0e0;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 4px !important;
            margin: 0 -4px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 8px !important;
            padding: 0 4px !important;
        }
    }
    
    @media (max-width: 480px) {
        .voucher-type-scroll-outer::-webkit-scrollbar {
            height: 4px;
        }
        
        .voucher-type-scroll-outer {
            padding: 0 2px !important;
            margin: 0 -2px !important;
        }
        
        .voucher-type-scroll-outer > div {
            gap: 6px !important;
            padding: 0 2px !important;
        }
    }
`;

const VoucherType = ({ 
    activeAccordion, 
    setActiveAccordion = () => {}, 
    selectedVoucherType, 
    setSelectedVoucherType,
    activitySelect,
    chooseFlightType,
    chooseLocation,
    selectedActivity,
    availableCapacity,
    selectedDate,
    selectedTime,
    onSectionCompletion,
    isDisabled = false,
    passengerData,
    setPassengerData,
    privateCharterWeatherRefund,
    setPrivateCharterWeatherRefund
}) => {
    const API_BASE_URL = config.API_BASE_URL;
    const [quantities, setQuantities] = useState({});
    const location = useLocation();

    // (moved below state declarations to avoid TDZ)
    const [showTerms, setShowTerms] = useState(false);
    const hasOpenedTermsFromDeepLink = useRef(false); // avoid reopening T&C repeatedly from deep link
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [availableVoucherTypes, setAvailableVoucherTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationPricing, setLocationPricing] = useState({});
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [showTwoVouchers, setShowTwoVouchers] = useState(true);
    const [slideDirection, setSlideDirection] = useState('right');
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [allVoucherTypesState, setAllVoucherTypesState] = useState([]);
    const [allVoucherTypesLoading, setAllVoucherTypesLoading] = useState(true);
    const [privateCharterVoucherTypes, setPrivateCharterVoucherTypes] = useState([]);
    const [privateCharterVoucherTypesLoading, setPrivateCharterVoucherTypesLoading] = useState(true);
    const [termsContent, setTermsContent] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);
    const [activityData, setActivityData] = useState(null);
    const [activityDataLoading, setActivityDataLoading] = useState(false);
    const [showCapacityWarning, setShowCapacityWarning] = useState(false);
    // Local UI state for instant weather refundable toggle feedback
    const [localSharedWeatherRefund, setLocalSharedWeatherRefund] = useState(false);
    // For Private Charter: per-voucher toggle state (title -> boolean)
    const [privateWeatherRefundByVoucher, setPrivateWeatherRefundByVoucher] = useState({});

    // Sync local shared toggle from passengerData
    useEffect(() => {
        const enabled = Array.isArray(passengerData) && passengerData.some(p => p && p.weatherRefund);
        setLocalSharedWeatherRefund(!!enabled);
    }, [passengerData]);

    // Keep global privateCharterWeatherRefund in sync with the currently selected voucher's toggle
    useEffect(() => {
        try {
            const currentTitle = selectedVoucherType?.title || selectedVoucher?.title;
            if (!currentTitle) return;
            const currentLocal = !!privateWeatherRefundByVoucher[currentTitle];
            if (setPrivateCharterWeatherRefund) {
                setPrivateCharterWeatherRefund(currentLocal);
            }
        } catch {}
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedVoucherType, selectedVoucher, privateWeatherRefundByVoucher]);

    // Prefill passenger count and weather refundable from URL parameters (Shopify deep-link)
    // Wait for voucher types to be loaded before setting passenger count
    useEffect(() => {
        try {
            const params = new URLSearchParams(location.search);
            if (params.get('source') !== 'shopify') return;
            
            const qpPassengers = parseInt(params.get('passengers') || '0', 10);
            const qpVoucherTitle = params.get('voucherTitle');
            const qpWeatherRefundable = params.get('weatherRefundable') === 'true';
            
            // Wait for voucher types to be available
            const allTitles = [
                ...(Array.isArray(allVoucherTypesState) ? allVoucherTypesState.map(v => v.title) : []),
                ...(Array.isArray(privateCharterVoucherTypes) ? privateCharterVoucherTypes.map(v => v.title) : [])
            ];
            
            if (qpVoucherTitle && allTitles.length > 0) {
                // Decode URL-encoded title (e.g., "Flexible+Weekday" -> "Flexible Weekday")
                const decodedTitle = decodeURIComponent(qpVoucherTitle.replace(/\+/g, ' '));
                
                // Find matching title (case-insensitive, normalized)
                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const targetTitle = allTitles.find(t => normalize(t) === normalize(decodedTitle) || normalize(t) === normalize(qpVoucherTitle));
                
                if (targetTitle) {
                    // Set passenger count if provided
                    if (qpPassengers > 0) {
                        console.log('🔵 VoucherType: Setting passenger count from URL:', {
                            urlTitle: decodedTitle,
                            matchedTitle: targetTitle,
                            passengers: qpPassengers
                        });
                        
                        setQuantities(prev => {
                            // Only update if not already set or if URL value is different
                            if (prev[targetTitle] === qpPassengers) return prev;
                            return {
                                ...prev,
                                [targetTitle]: qpPassengers,
                                [decodedTitle]: qpPassengers, // Also set with decoded title
                                [qpVoucherTitle]: qpPassengers // Also set with original title in case of encoding mismatch
                            };
                        });
                    }
                    
                    // Set weather refundable toggle if provided
                    if (qpWeatherRefundable) {
                        console.log('🔵 VoucherType: Setting weather refundable from URL:', {
                            urlTitle: decodedTitle,
                            matchedTitle: targetTitle,
                            weatherRefundable: qpWeatherRefundable
                        });
                        
                        // Check if this is a Shared Flight (Any Day Flight) or Private Charter
                        const isAnyDay = normalize(targetTitle).includes('any day');
                        const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
                        
                        if (isAnyDay && chooseFlightType?.type === 'Shared Flight') {
                            // For Shared Flight Any Day, set localSharedWeatherRefund
                            setLocalSharedWeatherRefund(true);
                            // Also update passengerData to reflect weather refund
                            if (Array.isArray(passengerData) && setPassengerData) {
                                const updated = passengerData.map(p => ({ ...p, weatherRefund: true }));
                                setPassengerData(updated);
                            }
                        } else if (isPrivateCharter) {
                            // For Private Charter, set per-voucher weather refund
                            setPrivateWeatherRefundByVoucher(prev => ({
                                ...prev,
                                [targetTitle]: true
                            }));
                            // If this voucher is selected, also update global state
                            if (selectedVoucherType?.title === targetTitle && setPrivateCharterWeatherRefund) {
                                setPrivateCharterWeatherRefund(true);
                            }
                        }
                    }
                } else {
                    console.log('🔵 VoucherType: Voucher title not found in available types:', {
                        urlTitle: decodedTitle,
                        availableTitles: allTitles
                    });
                }
            }
        } catch (e) {
            console.error('VoucherType: Error reading URL parameters for passenger count and weather refundable', e);
        }
    }, [location.search, allVoucherTypesState, privateCharterVoucherTypes, chooseFlightType?.type, passengerData, setPassengerData, selectedVoucherType?.title, setPrivateCharterWeatherRefund]);

    // Ensure default quantity=2 for every voucher title once data is available
    useEffect(() => {
        const titles = [];
        try {
            // Use raw lists available at this point to avoid TDZ on voucherTypes
            if (Array.isArray(allVoucherTypesState)) {
                titles.push(...allVoucherTypesState.map(v => v.title));
            }
            if (Array.isArray(privateCharterVoucherTypes)) {
                titles.push(...privateCharterVoucherTypes.map(v => v.title));
            }
        } catch {}
        if (titles.length === 0) return;
        setQuantities(prev => {
            const next = { ...prev };
            let changed = false;
            titles.forEach(t => {
                if (next[t] == null || Number.isNaN(parseInt(next[t], 10))) {
                    next[t] = 2; // default passengers
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [allVoucherTypesState, privateCharterVoucherTypes]);
    
    // Notification state for voucher type selection
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");

    // Mobile breakpoint
    const [isMobile, setIsMobile] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [canScrollVouchersLeft, setCanScrollVouchersLeft] = useState(false);
    const [canScrollVouchersRight, setCanScrollVouchersRight] = useState(true);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const voucherContainerRef = useRef(null);
    
    // Helper: compute one slide width (+ gap) reliably on mobile
    const getMobileItemWidth = (container) => {
        if (!container) return 0;
        const firstChild = container.children && container.children[0];
        const rectWidth = firstChild ? firstChild.getBoundingClientRect().width : container.clientWidth;
        const style = window.getComputedStyle(container);
        const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
        return rectWidth + gap;
    };
    
    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 576);
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Sync arrows/dots while swiping vouchers on mobile (based on ExperienceSection pattern)
    useEffect(() => {
        if (!isMobile) return;
        const container = voucherContainerRef.current;
        if (!container) return;

        let animationFrameId = null;

        const getItemWidth = () => {
            const firstChild = container.children && container.children[0];
            if (firstChild) {
                const styles = window.getComputedStyle(container);
                const gap = parseInt(styles.columnGap || styles.gap || '12', 10) || 12;
                return firstChild.getBoundingClientRect().width + gap;
            }
            return container.clientWidth;
        };

        const computeAndSet = () => {
            const { scrollLeft } = container;
            const itemCount = container.children.length;
            const itemWidth = getItemWidth();
            const index = Math.round(scrollLeft / itemWidth);
            const clamped = Math.max(0, Math.min(index, itemCount - 1));
            setCurrentItemIndex(clamped);
            setCanScrollVouchersLeft(clamped > 0);
            setCanScrollVouchersRight(clamped < itemCount - 1);
        };

        const handleScroll = () => {
            computeAndSet();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(computeAndSet);
        };

        const handleScrollEnd = () => {
            setTimeout(computeAndSet, 100);
        };

        const handleTouchStart = () => computeAndSet();
        const handleTouchMove = () => handleScroll();
        const handleTouchEnd = () => {
            setTimeout(computeAndSet, 50);
            setTimeout(computeAndSet, 150);
            setTimeout(computeAndSet, 300);
        };

        // initial
        computeAndSet();
        container.addEventListener('scroll', handleScroll, { passive: true });
        container.addEventListener('scrollend', handleScrollEnd, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('pointerdown', handleTouchStart, { passive: true });
        container.addEventListener('pointerup', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            container.removeEventListener('scrollend', handleScrollEnd);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('pointerdown', handleTouchStart);
            container.removeEventListener('pointerup', handleTouchEnd);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isMobile, allVoucherTypesState.length, privateCharterVoucherTypes.length]);

    // Reset animation flag after animation completes
    useEffect(() => {
        if (shouldAnimate) {
            const timer = setTimeout(() => {
                setShouldAnimate(false);
            }, 300); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [shouldAnimate]);

    // Keep layout sensible per device and experience type
    useEffect(() => {
        if (isMobile) {
            setShowTwoVouchers(false);
        } else {
            // For Private Charter, always show two vouchers if available
            if (chooseFlightType?.type === "Private Charter") {
                // Check if we have active private charter voucher types available
                const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
                if (activePrivateCharterVoucherTypes && activePrivateCharterVoucherTypes.length >= 2) {
                    // Always start with two vouchers view for Private Charter
                    setShowTwoVouchers(true);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show two vouchers (active count:', activePrivateCharterVoucherTypes.length, ')');
                    console.log('VoucherType: Available voucher types:', activePrivateCharterVoucherTypes.map(vt => vt.title));
                    
                    // If there are more than 2 voucher types, we'll show navigation arrows and dots
                    if (activePrivateCharterVoucherTypes.length > 2) {
                        console.log('VoucherType: Private Charter has more than 2 voucher types, navigation arrows and dots will be shown');
                        console.log('VoucherType: Total available:', activePrivateCharterVoucherTypes.length);
                        console.log('VoucherType: Will show first 2 initially, then allow navigation to others');
                    }
                } else if (activePrivateCharterVoucherTypes && activePrivateCharterVoucherTypes.length === 1) {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show single voucher (active count:', activePrivateCharterVoucherTypes.length, ')');
                } else {
                    setShowTwoVouchers(false);
                    setCurrentViewIndex(0);
                    console.log('VoucherType: Setting Private Charter to show no vouchers (active count:', activePrivateCharterVoucherTypes.length, ')');
                }
            } else {
                // For Shared Flight, default to two vouchers
                setShowTwoVouchers(true);
                setCurrentViewIndex(0);
                console.log('VoucherType: Setting Shared Flight to show two vouchers');
            }
        }
    }, [isMobile, chooseFlightType?.type, privateCharterVoucherTypes, availableVoucherTypes]);

    // Fetch all voucher types from API
    const fetchAllVoucherTypes = async () => {
        try {
            setAllVoucherTypesLoading(true);
            
            // Include location parameter if available to get location-specific pricing
            const locationParam = chooseLocation ? `?location=${encodeURIComponent(chooseLocation)}` : '';
            const url = `${API_BASE_URL}/api/voucher-types${locationParam}`;
            
            console.log('Fetching regular voucher types from:', url);
            
            const response = await fetch(url);
            console.log('Regular voucher types response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Regular voucher types data:', data);
                
                if (data.success) {
                    // Log the raw features data for debugging
                    console.log('Raw voucher types features data:', data.data.map(vt => ({ 
                        title: vt.title, 
                        features: vt.features,
                        featuresType: typeof vt.features 
                    })));
                    
                    setAllVoucherTypesState(data.data);
                    
                    // Initialize quantities and pricing from API data
                    const newQuantities = {};
                    const newPricing = {};
                    
                    data.data.forEach(vt => {
                        newQuantities[vt.title] = 2;
                        // Use the updated price_per_person from the API
                        newPricing[vt.title.toLowerCase().replace(/\s+/g, '_') + '_price'] = parseFloat(vt.price_per_person);
                        
                        // Log the pricing information for debugging
                        console.log(`VoucherType: ${vt.title} - price_per_person: ${vt.price_per_person}, activity_pricing:`, vt.activity_pricing);
                    });
                    
                    setQuantities(newQuantities);
                    setLocationPricing(newPricing);
                    
                    console.log('Regular voucher types loaded successfully:', data.data.length, 'types');
                    console.log('Updated locationPricing from voucher types API:', newPricing);
                } else {
                    console.error('Regular voucher types API returned success: false:', data);
                }
            } else {
                console.error('Failed to fetch regular voucher types. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching regular voucher types:', error);
        } finally {
            setAllVoucherTypesLoading(false);
        }
    };

    useEffect(() => {
        fetchAllVoucherTypes();
    }, [API_BASE_URL, chooseLocation]); // Auto-refresh when location changes

    // Auto-refresh when component mounts or when dependencies change
    useEffect(() => {
        // Initial fetch
        fetchAllVoucherTypes();
        
        // Set up interval for periodic refresh (every 2 minutes)
        const interval = setInterval(() => {
            console.log('VoucherType: Auto-refreshing voucher types...');
            fetchAllVoucherTypes();
        }, 2 * 60 * 1000); // 2 minutes

        return () => clearInterval(interval);
    }, [chooseLocation]); // Re-run when location changes

    // Refresh data when accordion becomes active
    useEffect(() => {
        if (activeAccordion === 'voucher-type') {
            console.log('VoucherType: Accordion became active, refreshing data...');
            fetchAllVoucherTypes();
            fetchPrivateCharterVoucherTypes();
            
            // Also refresh activity data for pricing
            if (chooseLocation) {
                // Force immediate refresh with cache busting
                setTimeout(() => fetchActivityData(), 100);
            }
        }
    }, [activeAccordion, chooseLocation]);

    // Force refresh all data (can be called manually if needed)
    const forceRefreshAllData = () => {
        console.log('VoucherType: Force refreshing all data...');
        fetchAllVoucherTypes();
        fetchPrivateCharterVoucherTypes();
        if (chooseLocation) {
            fetchActivityData();
        }
    };

    // Add keyboard shortcut for manual refresh (Ctrl+R or Cmd+R)
    useEffect(() => {
        const handleKeyDown = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
                event.preventDefault();
                console.log('VoucherType: Manual refresh triggered via keyboard shortcut');
                forceRefreshAllData();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);





    // Fetch private charter voucher types from API
    const fetchPrivateCharterVoucherTypes = async () => {
        try {
            setPrivateCharterVoucherTypesLoading(true);
            console.log('Fetching private charter voucher types from:', `${API_BASE_URL}/api/private-charter-voucher-types`);
            
            // Get only active private charter voucher types for frontend display
            // Include location to get activity-specific pricing
            const locationParam = chooseLocation ? `&location=${encodeURIComponent(chooseLocation)}` : '';
            // Include passengers to receive tiered per-person pricing from backend
            const selectedPassengers = 2; // default for card display; total recalculated on selection
            const response = await fetch(`${API_BASE_URL}/api/private-charter-voucher-types?active=true${locationParam}&passengers=${selectedPassengers}`);
            console.log('Private charter voucher types response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Private charter voucher types data:', data);
                
                if (data.success) {
                    setPrivateCharterVoucherTypes(data.data);
                    
                    // Initialize quantities for private charter voucher types
                    const newQuantities = { ...quantities };
                    data.data.forEach(vt => {
                        newQuantities[vt.title] = 2;
                    });
                    setQuantities(newQuantities);
                    
                    console.log('Private charter voucher types loaded successfully:', data.data.length, 'types');
                } else {
                    console.error('Private charter voucher types API returned success: false:', data);
                }
            } else {
                console.error('Failed to fetch private charter voucher types. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching private charter voucher types:', error);
        } finally {
            setPrivateCharterVoucherTypesLoading(false);
        }
    };

    useEffect(() => {
        fetchPrivateCharterVoucherTypes();
    }, [API_BASE_URL, chooseLocation]);

    // Fetch available voucher types for the selected location
    useEffect(() => {
        const fetchVoucherTypes = async () => {
            if (!chooseLocation) {
                setAvailableVoucherTypes([]);
                return;
            }
            
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/locationVoucherTypes/${encodeURIComponent(chooseLocation)}`);
                if (response.data.success) {
                    setAvailableVoucherTypes(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching voucher types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchVoucherTypes();
    }, [chooseLocation]);

    // Update locationPricing when selectedActivity changes
    useEffect(() => {
        console.log('VoucherType: selectedActivity changed:', selectedActivity);
        if (selectedActivity && selectedActivity.length > 0) {
            const activity = selectedActivity[0];
            const newPricing = {
                weekday_morning_price: parseFloat(activity.weekday_morning_price) || 180,
                flexible_weekday_price: parseFloat(activity.flexible_weekday_price) || 200,
                any_day_flight_price: parseFloat(activity.any_day_flight_price) || 220
            };
            console.log('VoucherType: Setting locationPricing from activity:', newPricing);
            setLocationPricing(newPricing);
        } else {
            // Fallback to default pricing
            const defaultPricing = {
                weekday_morning_price: 180,
                flexible_weekday_price: 200,
                any_day_flight_price: 220
            };
            console.log('VoucherType: Using default pricing:', defaultPricing);
            setLocationPricing(defaultPricing);
        }
    }, [selectedActivity]);

    // Fetch activity data to get individual pricing for private charter voucher types
    const fetchActivityData = async () => {
        setActivityDataLoading(true);
        try {
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const url = chooseLocation
                ? `${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}&t=${timestamp}`
                : `${API_BASE_URL}/api/activities/flight-types?t=${timestamp}`;
            const response = await axios.get(url);
            if (response.data.success && response.data.data.length > 0) {
                // Prefer activity matching location; else first one that has private_charter_pricing; else first
                let activity = response.data.data[0];
                if (chooseLocation) {
                    const matched = response.data.data.find(a => (a.location || '').toLowerCase() === (chooseLocation || '').toLowerCase());
                    if (matched) activity = matched;
                } else {
                    const withPricing = response.data.data.find(a => a && a.private_charter_pricing);
                    if (withPricing) activity = withPricing;
                }
                setActivityData(activity);
                console.log('VoucherType: Activity data loaded:', activity);
                console.log('VoucherType: Private charter pricing field:', activity.private_charter_pricing);
                console.log('VoucherType: Private charter pricing type:', typeof activity.private_charter_pricing);
                console.log('VoucherType: Shared flight pricing fields:', {
                    weekday_morning_price: activity.weekday_morning_price,
                    flexible_weekday_price: activity.flexible_weekday_price,
                    any_day_flight_price: activity.any_day_flight_price,
                    shared_flight_from_price: activity.shared_flight_from_price
                });
            } else {
                console.log('VoucherType: No activity data found for location:', chooseLocation);
            }
        } catch (error) {
            console.error('Error fetching activity data:', error);
        } finally {
            setActivityDataLoading(false);
        }
    };

    // Fetch activity data when location changes
    useEffect(() => {
        fetchActivityData();
        
        // Set up interval for periodic refresh of activity data (every 1 minute)
        const interval = setInterval(() => {
            console.log('VoucherType: Auto-refreshing activity data...');
            fetchActivityData();
        }, 1 * 60 * 1000); // 1 minute

        return () => clearInterval(interval);
    }, [chooseLocation]);

    // Ensure activity data is also available when switching flows (e.g., Flight Voucher / Buy Gift)
    useEffect(() => {
        if (chooseFlightType?.type === 'Private Charter' && !activityData) {
            fetchActivityData();
        }
    }, [chooseFlightType?.type]);

    const voucherTypes = useMemo(() => {
        // Determine which voucher types to show based on selected experience
        const isPrivateCharter = chooseFlightType?.type === "Private Charter";
        
        console.log('VoucherType: voucherTypes useMemo triggered');
        console.log('VoucherType: chooseFlightType:', chooseFlightType);
        console.log('VoucherType: isPrivateCharter:', isPrivateCharter);
        console.log('VoucherType: allVoucherTypes count:', allVoucherTypesState.length);
        console.log('VoucherType: privateCharterVoucherTypes count:', privateCharterVoucherTypes.length);
        console.log('VoucherType: activityData for pricing:', activityData);
        console.log('VoucherType: locationPricing fallback:', locationPricing);
        
        if (isPrivateCharter) {
            // For Private Charter, show only active private charter voucher types
            if (privateCharterVoucherTypesLoading || privateCharterVoucherTypes.length === 0) {
                console.log('VoucherType: Private Charter - no voucher types available yet');
                return [];
            }
            
            // Filter only active private charter voucher types
            const activePrivateCharterVoucherTypes = privateCharterVoucherTypes.filter(vt => vt.is_active === 1);
            
            if (activePrivateCharterVoucherTypes.length === 0) {
                console.log('VoucherType: Private Charter - no active voucher types available');
                return [];
            }
            
            console.log('VoucherType: Creating private charter voucher types with locationPricing:', locationPricing);
            console.log('VoucherType: All Private Charter voucher types count:', privateCharterVoucherTypes.length);
            console.log('VoucherType: Active Private Charter voucher types count:', activePrivateCharterVoucherTypes.length);
            console.log('VoucherType: Active Private Charter voucher types:', activePrivateCharterVoucherTypes.map(vt => vt.title));
            console.log('VoucherType: Raw private charter voucher types data:', activePrivateCharterVoucherTypes.map(vt => ({ id: vt.id, title: vt.title, terms: vt.terms })));
            
            // Helper to find a price in activity private_charter_pricing by tolerant title matching
            const findGroupPriceForTitle = (pricingDataRaw, voucherTitleRaw) => {
                if (pricingDataRaw == null) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') {
                        pricingData = JSON.parse(pricingData);
                    }
                } catch {
                    return undefined;
                }
                // Guard: parsed value must be a plain object
                if (pricingData == null || typeof pricingData !== 'object' || Array.isArray(pricingData)) {
                    return undefined;
                }

                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);

                // Direct hits (with optional chaining safety)
                if (pricingData && pricingData[voucherTitleRaw] != null) return pricingData[voucherTitleRaw];
                if (pricingData && pricingData[voucherTitleRaw?.trim?.()] != null) return pricingData[voucherTitleRaw.trim()];

                // Normalized scan
                for (const key of Object.keys(pricingData)) {
                    if (normalize(key) === titleNorm) {
                        return pricingData[key];
                    }
                }
                return undefined;
            };

            const privateVouchers = activePrivateCharterVoucherTypes.map(vt => {
                console.log(`VoucherType: Processing voucher type: ${vt.title} (ID: ${vt.id})`);
                
                // Parse features from JSON string
                let features = [];
                try {
                    // Clean up the JSON string first - fix common syntax errors
                    let featuresJson = vt.features || '[]';
                    
                    // Fix common JSON syntax errors
                    featuresJson = featuresJson
                        .replace(/\."/g, '",')  // Replace ." with ,"
                        .replace(/,$/, '')      // Remove trailing comma
                        .replace(/,\s*]/g, ']'); // Remove comma before closing bracket
                    
                    features = JSON.parse(featuresJson);
                    console.log(`VoucherType: ${vt.title} - Parsed features from JSON:`, features);
                } catch (e) {
                    console.warn(`VoucherType: ${vt.title} - Failed to parse features JSON:`, vt.features, 'Error:', e);
                    console.warn(`VoucherType: ${vt.title} - Attempting to parse as array manually...`);
                    
                    // Try to parse as a simple array by splitting on commas
                    try {
                        const cleanedFeatures = vt.features
                            .replace(/[\[\]"]/g, '') // Remove brackets and quotes
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0);
                        features = cleanedFeatures;
                        console.log(`VoucherType: ${vt.title} - Manually parsed features:`, features);
                    } catch (manualError) {
                        console.warn(`VoucherType: ${vt.title} - Manual parsing also failed:`, manualError);
                        features = [];
                    }
                }
                
                // If no features are available, log a warning but don't use hardcoded fallback
                if (!features || features.length === 0) {
                    console.warn(`VoucherType: ${vt.title} - No features available in database. Please check the Features (JSON Array) field in the admin panel.`);
                }

                // For private charter, use the enhanced pricing from the API (which includes activity-specific pricing)
                let basePrice = 300; // Default fallback base price per person
                let priceUnit = 'pp'; // Default to per person pricing
                
                console.log(`VoucherType: Processing pricing for ${vt.title} (ID: ${vt.id})`);
                console.log(`VoucherType: Voucher type price_per_person: ${vt.price_per_person}, price_unit: ${vt.price_unit}`);
                console.log(`VoucherType: Activity data available:`, !!activityData);
                console.log(`VoucherType: Private charter pricing available:`, !!(activityData && activityData.private_charter_pricing));
                
                // Use the enhanced pricing from the API (which includes activity-specific pricing)
                if (vt.price_per_person && vt.price_per_person !== "0.00") {
                    basePrice = parseFloat(vt.price_per_person);
                    priceUnit = vt.price_unit || 'total';
                    console.log(`VoucherType: Using enhanced API pricing for ${vt.title}: £${basePrice} (unit: ${priceUnit})`);
                } else {
                    // Fallback to activity data pricing if API doesn't have it
                    if (activityData && activityData.private_charter_pricing) {
                        const matched = findGroupPriceForTitle(activityData.private_charter_pricing, vt.title);
                        if (matched != null && matched !== '') {
                            const parsed = parseFloat(matched);
                            if (!Number.isNaN(parsed)) {
                                basePrice = parsed;
                                priceUnit = 'pp';
                                console.log(`VoucherType: Using tolerant group pricing for ${vt.title}: £${basePrice} per person (matched=${matched})`);
                            }
                        } else {
                            console.log(`VoucherType: No tolerant group pricing match for ${vt.title}`);
                        }
                    } else {
                        console.log(`VoucherType: No activity data or pricing available for ${vt.title}, using default: £${basePrice} per person`);
                    }
                }
                
                // For Private Charter with total pricing, card should show the total
                const totalPrice = basePrice;

                // Handle image URL properly - check if it's a full URL or relative path
                let imageUrl = weekdayMorningImg; // Default fallback
                if (vt.image_url) {
                    if (vt.image_url.startsWith('http')) {
                        imageUrl = vt.image_url;
                    } else if (vt.image_url.startsWith('/uploads/')) {
                        imageUrl = `${API_BASE_URL}${vt.image_url}`;
                    } else {
                        imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
                    }
                }

                console.log(`VoucherType: Private Charter ${vt.title} - API price: ${vt.price_per_person}, Price unit: ${priceUnit}, Image: ${imageUrl}`);

                return {
                    id: vt.id,
                    title: vt.title,
                    description: vt.description || 'Exclusive private balloon experience for your group. Perfect for special occasions and intimate groups.',
                    image: imageUrl,
                    imageTextTag: vt.image_text_tag || '',
                    availability: vt.flight_days || 'Any Day',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
                    refundability: 'Non-Refundable',
                    inclusions: features,
                    // Show terms only if provided; otherwise hide
                    weatherClause: (vt.terms && vt.terms.trim() !== '') ? vt.terms : '',
                    price: totalPrice, // Total price for selected tier
                    basePrice: basePrice, // Store base price (total) for calculations
                    priceUnit: priceUnit,
                    maxPassengers: vt.max_passengers || 8,
                    flightTime: vt.flight_time || 'AM & PM',
                    is_active: vt.is_active // Add is_active to the voucher object
                };
            });
            
            console.log('VoucherType: Private Charter voucher types created:', privateVouchers.length);
            console.log('VoucherType: Final Private Charter pricing:', privateVouchers.map(vt => ({ title: vt.title, price: vt.price, priceUnit: vt.priceUnit })));
            console.log('VoucherType: Private Charter weather clauses:', privateVouchers.map(vt => ({ title: vt.title, weatherClause: vt.weatherClause })));
            console.log('VoucherType: Private Charter voucher types for selection:', privateVouchers);
            console.log('VoucherType: Private Charter - returning voucher types for display');
            return privateVouchers;
        } else {
            // For Shared Flight, show regular voucher types
            if (allVoucherTypesLoading || allVoucherTypesState.length === 0) {
                console.log('VoucherType: Shared Flight - no voucher types available yet');
                return [];
            }

                            console.log('VoucherType: Creating regular voucher types with activityData:', activityData);
                console.log('VoucherType: Creating regular voucher types with locationPricing (fallback):', locationPricing);
                console.log('VoucherType: Raw voucher types data:', allVoucherTypesState.map(vt => ({ id: vt.id, title: vt.title, terms: vt.terms })));
            
            // Create voucher types for Shared Flight
            console.log('VoucherType: Processing shared flight voucher types with raw data:', allVoucherTypesState.map(vt => ({ 
                title: vt.title, 
                features: vt.features,
                featuresType: typeof vt.features 
            })));
            
            const sharedFlightVouchers = allVoucherTypesState.map(vt => {
                // Use the updated price_per_person from the voucher types API (which now includes activity pricing)
                let basePrice = parseFloat(vt.price_per_person) || 180; // Use API price, fallback to default
                let priceUnit = 'pp';
                
                console.log(`VoucherType: ${vt.title} - Using price_per_person from API: ${basePrice}`);
                
                // Fallback to activity data if API price is not available
                if (!vt.price_per_person || vt.price_per_person === '0.00') {
                    if (activityData) {
                        // Use activity-specific pricing if available
                        if (vt.title === 'Weekday Morning' && activityData.weekday_morning_price) {
                            basePrice = parseFloat(activityData.weekday_morning_price);
                        } else if (vt.title === 'Flexible Weekday' && activityData.flexible_weekday_price) {
                            basePrice = parseFloat(activityData.flexible_weekday_price);
                        } else if (vt.title === 'Any Day Flight' && activityData.any_day_flight_price) {
                            basePrice = parseFloat(activityData.any_day_flight_price);
                        }
                    } else {
                        // Fallback to locationPricing
                        if (vt.title === 'Weekday Morning') {
                            basePrice = locationPricing.weekday_morning_price;
                        } else if (vt.title === 'Flexible Weekday') {
                            basePrice = locationPricing.flexible_weekday_price;
                        } else if (vt.title === 'Any Day Flight') {
                            basePrice = locationPricing.any_day_flight_price;
                        }
                    }
                    console.log(`VoucherType: ${vt.title} - Using fallback pricing: ${basePrice}`);
                }

                // Don't calculate total price here - let the summary panel calculate it dynamically
                // based on the actual passenger count selected by the user

                // Handle image URL properly
                let imageUrl = weekdayMorningImg; // Default fallback
                if (vt.image_url) {
                    if (vt.image_url.startsWith('http')) {
                        imageUrl = vt.image_url;
                    } else if (vt.image_url.startsWith('/uploads/')) {
                        imageUrl = `${API_BASE_URL}${vt.image_url}`;
                    } else {
                        imageUrl = `${API_BASE_URL}/uploads/experiences/${vt.image_url}`;
                    }
                }

                // Parse features from JSON string
                let features = [];
                
                // Debug: Log the raw features data
                console.log(`VoucherType: ${vt.title} - Raw features data:`, {
                    features: vt.features,
                    type: typeof vt.features,
                    length: vt.features ? vt.features.length : 0
                });
                
                try {
                    // Clean up the JSON string first - fix common syntax errors
                    let featuresJson = vt.features || '[]';
                    
                    // Fix common JSON syntax errors
                    featuresJson = featuresJson
                        .replace(/\."/g, '",')  // Replace ." with ,"
                        .replace(/,$/, '')      // Remove trailing comma
                        .replace(/,\s*]/g, ']'); // Remove comma before closing bracket
                    
                    console.log(`VoucherType: ${vt.title} - Cleaned features JSON:`, featuresJson);
                    
                    features = JSON.parse(featuresJson);
                    console.log(`VoucherType: ${vt.title} - Successfully parsed features from JSON:`, features);
                } catch (e) {
                    console.warn(`VoucherType: ${vt.title} - Failed to parse features JSON:`, vt.features, 'Error:', e);
                    console.warn(`VoucherType: ${vt.title} - Attempting to parse as array manually...`);
                    
                    // Try to parse as a simple array by splitting on commas
                    try {
                        const cleanedFeatures = vt.features
                            .replace(/[\[\]"]/g, '') // Remove brackets and quotes
                            .split(',')
                            .map(f => f.trim())
                            .filter(f => f.length > 0);
                        features = cleanedFeatures;
                        console.log(`VoucherType: ${vt.title} - Manually parsed features:`, features);
                    } catch (manualError) {
                        console.warn(`VoucherType: ${vt.title} - Manual parsing also failed:`, manualError);
                        features = [];
                    }
                }
                
                // If no features are available, log a warning but don't use hardcoded fallback
                if (!features || features.length === 0) {
                    console.warn(`VoucherType: ${vt.title} - No features available in database. Please check the Features (JSON Array) field in the admin panel.`);
                }

                return {
                    id: vt.id,
                    title: vt.title,
                    description: vt.description || 'Shared balloon experience with other passengers. Perfect for individuals and small groups.',
                    image: imageUrl,
                    imageTextTag: vt.image_text_tag || '',
                    availability: vt.flight_days || 'Any Day',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
                    refundability: 'Non-Refundable',
                    inclusions: features,
                    // Show terms only if provided; otherwise hide
                    weatherClause: (vt.terms && vt.terms.trim() !== '') ? vt.terms : '',
                    price: basePrice, // Set price to basePrice, let summary calculate total
                    basePrice: basePrice,
                    priceUnit: priceUnit,
                    maxPassengers: vt.max_passengers || 8,
                    flightTime: vt.flight_time || 'AM & PM',
                    is_active: vt.is_active // Add is_active to the voucher object
                };
            });

            console.log('VoucherType: Shared Flight voucher types created:', sharedFlightVouchers.length);
            console.log('VoucherType: Shared Flight weather clauses:', sharedFlightVouchers.map(vt => ({ title: vt.title, weatherClause: vt.weatherClause })));
            console.log('VoucherType: Shared Flight features:', sharedFlightVouchers.map(vt => ({ title: vt.title, inclusions: vt.inclusions })));
            console.log('VoucherType: Shared Flight pricing details:', sharedFlightVouchers.map(vt => ({ 
                title: vt.title, 
                basePrice: vt.basePrice, 
                price: vt.price, 
                priceUnit: vt.priceUnit,
                originalPricePerPerson: vt.price_per_person
            })));
            console.log('VoucherType: Final pricing summary for shared flight vouchers:', sharedFlightVouchers.map(vt => ({
                title: vt.title,
            displayPrice: `£${vt.basePrice} pp`,
                totalPrice: vt.price,
                basePrice: vt.basePrice
            })));
            return sharedFlightVouchers;
        }
    }, [chooseFlightType?.type, allVoucherTypesState, allVoucherTypesLoading, privateCharterVoucherTypes, privateCharterVoucherTypesLoading, activityData, locationPricing, API_BASE_URL, chooseLocation]);

    // When coming from deep links (ör. Shopify) üst component sadece title/quantity
    // içeren bir selectedVoucherType gönderebiliyor. voucherTypes yüklendikten sonra
    // bu title’a göre gerçek voucher objesini bulup kartı seçili yapıyor ve fiyatı
    // otomatik hesaplıyoruz.
    useEffect(() => {
        try {
            if (!selectedVoucherType || !selectedVoucherType.title) return;
            if (!Array.isArray(voucherTypes) || voucherTypes.length === 0) return;

            // Zaten id’li ve local selectedVoucher set edilmişse tekrar çalıştırma
            if (selectedVoucherType.id && selectedVoucher) return;

            const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
            const targetTitle = normalize(selectedVoucherType.title);

            const matched = voucherTypes.find(v => normalize(v.title) === targetTitle);
            if (!matched) return;

            const quantityFromUrl = parseInt(
                selectedVoucherType.quantity || selectedVoucherType.passengers || 2,
                10
            ) || 2;

            console.log('VoucherType: Deep-link prefill – matched voucher by title:', {
                incoming: selectedVoucherType,
                matched,
                quantityFromUrl
            });

            const enriched = buildVoucherWithQuantity(matched, quantityFromUrl);

            // Passenger input'larını da senkronize et - URL'den gelen passenger sayısını öncelikle kullan
            const urlParams = new URLSearchParams(window.location.search);
            const urlPassengers = urlParams.get('source') === 'shopify' ? parseInt(urlParams.get('passengers') || '0', 10) : 0;
            const finalQuantity = urlPassengers > 0 ? urlPassengers : enriched.quantity;
            
            setQuantities(prev => ({
                ...prev,
                [matched.title]: finalQuantity
            }));
            
            // Enriched voucher'ı da güncellenmiş quantity ile oluştur
            const finalEnriched = buildVoucherWithQuantity(matched, finalQuantity);

            // Weather Refundable toggle'ını set et (URL'den veya selectedVoucherType'dan)
            const shouldEnableWeatherRefund = selectedVoucherType?.weatherRefundable === true || urlParams.get('weatherRefundable') === 'true';
            if (shouldEnableWeatherRefund) {
                const isAnyDay = typeof matched.title === 'string' && matched.title.toLowerCase().includes('any day');
                const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
                
                if (isAnyDay && chooseFlightType?.type === 'Shared Flight') {
                    // For Shared Flight Any Day, set localSharedWeatherRefund
                    setLocalSharedWeatherRefund(true);
                    // Also update passengerData to reflect weather refund
                    if (Array.isArray(passengerData) && setPassengerData) {
                        const updated = passengerData.map(p => ({ ...p, weatherRefund: true }));
                        setPassengerData(updated);
                    }
                } else if (isPrivateCharter) {
                    // For Private Charter, set per-voucher weather refund
                    setPrivateWeatherRefundByVoucher(prev => ({
                        ...prev,
                        [matched.title]: true
                    }));
                    // Also update global state
                    if (setPrivateCharterWeatherRefund) {
                        setPrivateCharterWeatherRefund(true);
                    }
                }
            }

            // Hem local hem de parent state'i update et – özet ekran + kartlar senkron
            setSelectedVoucher(finalEnriched || enriched);
            setSelectedVoucherType(finalEnriched || enriched);

            // If coming from Shopify deep link, auto-open Terms & Conditions once
            const isShopifySource = urlParams.get('source') === 'shopify';
            const startAtVoucher = urlParams.get('startAt') === 'voucher-type' || !!urlParams.get('voucherTitle');
            if (isShopifySource && startAtVoucher && !hasOpenedTermsFromDeepLink.current) {
                hasOpenedTermsFromDeepLink.current = true;
                // Auto-open Terms & Conditions for deep-linked voucher
                openTermsForVoucher(finalEnriched || enriched);
            }
        } catch (e) {
            console.error('VoucherType: Error applying deep-link voucher prefill', e);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voucherTypes, selectedVoucherType?.title]);

    // Remove the duplicate privateCharterVoucherTypesMemo since it's now integrated into voucherTypes

    const handleQuantityChange = (voucherTitle, value) => {
        const newValue = parseInt(value) || 2;
        
        // Check if Live Availability capacity limit is exceeded
        if (selectedDate && selectedTime && availableCapacity !== null && newValue > availableCapacity) {
            console.log(`Capacity warning: Trying to select ${newValue} passengers but only ${availableCapacity} available`);
            setShowCapacityWarning(true);
            return; // Don't update quantity
        }
        
        // For Private Charter, only allow specific passenger counts: 2, 3, 4, 8
        if (chooseFlightType?.type === "Private Charter") {
            // For Proposal Flight, cap at 2 passengers only
            const isProposal = typeof voucherTitle === 'string' && voucherTitle.toLowerCase().includes('proposal');
            const allowedPassengers = isProposal ? [2] : [2, 3, 4, 8];
            let finalValue = newValue;
            
            // If it's a manual input, find the closest allowed value
            if (typeof value === 'string' || typeof value === 'number') {
                finalValue = parseInt(value) || 2;
                // Find the closest allowed passenger count
                let closest = allowedPassengers[0];
                let minDiff = Math.abs(finalValue - closest);
                
                for (let allowed of allowedPassengers) {
                    const diff = Math.abs(finalValue - allowed);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = allowed;
                    }
                }
                finalValue = closest;
            }
            
            // Additional check for capacity limit
            if (selectedDate && selectedTime && availableCapacity !== null && finalValue > availableCapacity) {
                console.log(`Private Charter capacity warning: Trying to select ${finalValue} passengers but only ${availableCapacity} available`);
                setShowCapacityWarning(true);
                return; // Don't update quantity
            }
            
            console.log(`Private Charter quantity change for ${voucherTitle}: ${finalValue} passengers`);
            
            setQuantities(prev => ({
                ...prev,
                [voucherTitle]: finalValue
            }));
        } else {
            // For other flight types, use the original logic
            const finalValue = Math.max(1, parseInt(value) || 1);
            
            // Additional check for capacity limit
            if (selectedDate && selectedTime && availableCapacity !== null && finalValue > availableCapacity) {
                console.log(`Shared Flight capacity warning: Trying to select ${finalValue} passengers but only ${availableCapacity} available`);
                setShowCapacityWarning(true);
                return; // Don't update quantity
            }
            
            setQuantities(prev => ({
                ...prev,
                [voucherTitle]: finalValue
            }));
        }
    };

    // Helper function to get next allowed passenger count
    const getNextAllowedPassenger = (current, direction) => {
        // For Private Charter, only 2,3,4,8 are valid steps so the + button should jump 4 -> 8
        const isProposal = typeof current === 'number' ? false : false; // current unused for detection here
        const allowedPassengers = (chooseFlightType?.type === "Private Charter")
            ? [2, 3, 4, 8]
            : [1, 2, 3, 4, 5, 6, 7, 8];
        const currentIndex = allowedPassengers.indexOf(current);
        // If current not in array (e.g., direct input), snap to nearest valid value
        const safeIndex = currentIndex === -1 ? 0 : currentIndex;
        if (direction === 'next') {
            return allowedPassengers[Math.min(safeIndex + 1, allowedPassengers.length - 1)];
        } else {
            return allowedPassengers[Math.max(safeIndex - 1, 0)];
        }
    };

    // VoucherCard component for displaying individual voucher cards
    const VoucherCard = ({ voucher, onSelect, quantities, setQuantities, isSelected, slideDirection, showTwoVouchers, shouldAnimate }) => {
        // Compute dynamic display price for Private Charter based on selected passengers
        let privateCharterDisplayTotal = voucher.price;
        if (chooseFlightType?.type === "Private Charter") {
            const selectedPassengers = parseInt(quantities[voucher.title] || 2, 10);
            // Try to get tiered price from activityData.private_charter_pricing
            const getTieredGroupPrice = (pricingDataRaw, voucherTitleRaw, passengers) => {
                if (pricingDataRaw == null) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') pricingData = JSON.parse(pricingData);
                } catch {
                    return undefined;
                }
                if (pricingData == null || typeof pricingData !== 'object' || Array.isArray(pricingData)) return undefined;
                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);
                const resolveForTitle = (obj, title) => {
                    if (!obj || typeof obj !== 'object') return undefined;
                    if (obj[title] != null) return obj[title];
                    if (obj[title?.trim?.()] != null) return obj[title.trim()];
                    for (const k of Object.keys(obj)) { if (normalize(k) === titleNorm) return obj[k]; }
                    return undefined;
                };
                const byTitle = resolveForTitle(pricingData, voucherTitleRaw);
                if (byTitle == null) return undefined;
                if (typeof byTitle === 'object') {
                    const key = String([2,3,4,8].includes(passengers) ? passengers : 2);
                    const v = byTitle[key] ?? byTitle['2'];
                    const p = parseFloat(v);
                    return Number.isNaN(p) ? undefined : p;
                }
                const p = parseFloat(byTitle);
                return Number.isNaN(p) ? undefined : p;
            };
            const tier = getTieredGroupPrice(activityData?.private_charter_pricing, voucher.title, selectedPassengers);
            if (tier !== undefined) privateCharterDisplayTotal = tier;
            else privateCharterDisplayTotal = voucher.basePrice || voucher.price;
        }
        return (
            <div style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                // Mobile: card wider (calc(100% - 12px) for slightly larger cards); desktop fixed width
                width: isMobile ? 'calc(100% - 0px)' : '320px',
                minWidth: isMobile ? 'calc(100% - 0px)' : '320px',
                maxWidth: isMobile ? 'calc(100% - 0px)' : '320px',
                // Ensure all voucher cards (shared & private) have at least the same height
                // For desktop shared vouchers, use a larger minHeight to ensure all cards have the same height
                // For mobile and private vouchers, use the standard minHeight
                // Reduce height for Buy Flight Voucher and Buy Gift Voucher
                minHeight: (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') 
                    ? (isMobile ? 520 : (chooseFlightType?.type === 'Shared Flight' ? 540 : 500))
                    : (isMobile ? 540 : (chooseFlightType?.type === 'Shared Flight' ? 600 : 540)),
                flexShrink: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: isMobile ? 'hidden' : 'visible',
                animation: shouldAnimate ? (slideDirection === 'right' ? 'slideInRight 0.3s ease-in-out' : slideDirection === 'left' ? 'slideInLeft 0.3s ease-in-out' : 'none') : 'none',
                border: isSelected ? '2px solid #03a9f4' : 'none',
                scrollSnapAlign: isMobile ? 'start' : 'none',
                position: 'relative'
            }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: 180,
                    overflow: 'hidden',
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16
                }}>
                    <img
                        src={voucher.image}
                        alt={voucher.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                        }}
                    />
                    {voucher.imageTextTag && (
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bottom: 16,
                            background: '#FF6937',
                            color: '#fff',
                            padding: '6px 12px',
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 700,
                            textAlign: 'center',
                            lineHeight: 1.2,
                            maxWidth: '82%',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            boxShadow: '0 4px 10px rgba(255, 105, 55, 0.35)'
                        }}>
                            {voucher.imageTextTag}
                        </div>
                    )}
                </div>
                <div style={{ 
                    padding: '16px', 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    display: 'grid', 
                    flexDirection: 'column', 
                    flex: 1,
                    overflow: 'visible',
                    position: 'relative'
                }}>
                    <h3 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{voucher.title}</h3>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, lineHeight: '1.3', fontStyle: 'italic' }}>{voucher.description}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.availability}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.flightTime}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.validity}</div>
                    {(() => {
                        const isAnyDay = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('any day');
                        const isShared = chooseFlightType?.type === 'Shared Flight';
                        const isPrivate = chooseFlightType?.type === 'Private Charter';
                        const sharedEnabled = isShared && isAnyDay && !!localSharedWeatherRefund;
                        const privateEnabled = isPrivate && !!privateWeatherRefundByVoucher?.[voucher.title];
                        const refundabilityText = (sharedEnabled || privateEnabled)
                            ? 'Refundable'
                            : (voucher.refundability || 'Non-Refundable');
                        return (
                            <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 10, fontWeight: 600 }}>{refundabilityText}</div>
                        );
                    })()}
                    <div style={{ paddingLeft: 0, margin: 0, marginBottom: 10, color: '#666', fontSize: isMobile ? 14 : 13, lineHeight: '1.3' }}>
                        {(() => {
                            console.log(`VoucherType: Rendering features for ${voucher.title}:`, voucher.inclusions);
                            
                            if (!voucher.inclusions || voucher.inclusions.length === 0) {
                                return (
                                    <div style={{ fontStyle: 'italic', color: '#999' }}>
                                        Features will be loaded from the admin panel...
                                    </div>
                                );
                            }
                            
                            return voucher.inclusions.map((inclusion, i) => {
                                const isAnyDay = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('any day');
                                return (
                                    <div key={i} style={{ marginBottom: 3 }}>
                                        {inclusion}
                                        {inclusion === 'Flight Certificate' && !isAnyDay && (
                                            <div style={{ marginTop: 6, fontSize: isMobile ? 13 : 12, color: '#666', lineHeight: '1.2' }}>
                                                ✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 24 months. Fly within 6 attempts, or we'll extend your voucher free of charge.
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                    {/* Dynamic cancellation policy message for Any Day Flight and Private Charter */}
                    {(() => {
                        const isAnyDay = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('any day');
                        const isSharedFlight = chooseFlightType?.type === 'Shared Flight';
                        const isPrivateCharter = chooseFlightType?.type === 'Private Charter';
                        const isPrivateVoucher = isPrivateCharter && voucher.title;
                        
                        // Any Day Flight message
                        if (isSharedFlight && isAnyDay && activitySelect === 'Book Flight') {
                            const anyDayMsg1 = "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 24 months. Fly within 6 attempts, or we'll extend your voucher free of charge.";
                            const anyDayMsg2 = "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 24 months. Alternatively, you may request a refund within 6 months of purchase.";
                            
                            return (
                                <div style={{
                                    fontSize: isMobile ? 14 : 13,
                                    color: '#666',
                                    marginBottom: 12,
                                    lineHeight: '1.2',
                
                                }}>
                                    {localSharedWeatherRefund ? anyDayMsg2 : anyDayMsg1}
                                </div>
                            );
                        }
                        
                        // Private Charter message
                        if (isPrivateVoucher && activitySelect === 'Book Flight') {
                            const privateMsg1 = "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 18 months. Fly within 6 attempts, or we'll extend your voucher free of charge.";
                            const privateMsg2 = "✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 18 months. Alternatively, you may request a refund within 6 months of purchase.";
                            
                            return (
                                <div style={{
                                    fontSize: isMobile ? 14 : 13,
                                    color: '#666',
                                    marginBottom: 12,
                                    lineHeight: '1.2',
                                    background: '#f8fafc',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 8,
                                    padding: '8px 10px'
                                }}>
                                    {privateWeatherRefundByVoucher?.[voucher.title] ? privateMsg2 : privateMsg1}
                                </div>
                            );
                        }
                        
                        return null;
                    })()}
                    {/* Cancellation policy for Flexible Weekday and Weekday Morning - only for Book Flight Date */}
                    {(() => {
                        const isFlexibleWeekday = voucher.title === 'Flexible Weekday';
                        const isWeekdayMorning = voucher.title === 'Weekday Morning';
                        const isBookFlight = activitySelect === 'Book Flight';
                        
                        if ((isFlexibleWeekday || isWeekdayMorning) && isBookFlight) {
                            return (
                                <div style={{
                                    fontSize: isMobile ? 13 : 13,
                                    color: '#666',
                                    marginBottom: 12,
                                    lineHeight: '1.2'
                                }}>
                                    ✓ In the event of a flight cancellation, your voucher remains valid for rebooking within 18 months. Fly within 6 attempts, or we'll extend your voucher free of charge.
                                </div>
                            );
                        }
                        return null;
                    })()}
                    
                    {/* Weather refundable toggle moved below price, above Select */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        marginBottom: (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') ? 6 : 12, 
                        gap: isMobile ? '8px' : '8px' 
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isMobile ? '4px' : '8px',
                            flexWrap: isMobile ? 'nowrap' : 'wrap',
                            // Ensure Proposal Flight passenger section has same height as Private Charter selector
                            minHeight: voucher.title && typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('proposal') ? (isMobile ? '40px' : '32px') : 'auto'
                        }}>
                            <label style={{ 
                                fontSize: isMobile ? 16 : 13, 
                                color: '#666', 
                                fontWeight: isMobile ? 500 : 500,
                                marginBottom: '0',
                                whiteSpace: isMobile ? 'nowrap' : 'normal'
                            }}>Passengers:</label>
                            {voucher.title && typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('proposal') ? (
                                <span style={{ fontSize: isMobile ? 16 : 13, color: '#666', fontWeight: isMobile ? 500 : 500, marginBottom: '0', whiteSpace: isMobile ? 'nowrap' : 'normal' }}>2</span>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'prev'))}
                                        style={{ 
                                            padding: isMobile ? '8px 12px' : '4px 8px', 
                                            border: '1px solid #ddd', 
                                            background: '#f9f9f9', 
                                            borderRadius: 4, 
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '14px' : '14px',
                                            minHeight: isMobile ? '40px' : 'auto',
                                            minWidth: isMobile ? '40px' : 'auto'
                                        }}
                                    >
                                        −
                                    </button>
                                    <input 
                                        type="number" 
                                        min={chooseFlightType?.type === "Private Charter" ? 2 : 1}
                                        max={availableCapacity !== null && selectedDate && selectedTime ? 
                                            Math.min(
                                                availableCapacity, 
                                                chooseFlightType?.type === "Private Charter" ? (voucher.title?.toLowerCase().includes('proposal') ? 2 : 8) : (voucher.maxPassengers || 8)
                                            ) : 
                                            (chooseFlightType?.type === "Private Charter" ? (voucher.title?.toLowerCase().includes('proposal') ? 2 : 8) : (voucher.maxPassengers || 8))
                                        }
                                        value={quantities[voucher.title] || 2} 
                                        onChange={(e) => handleQuantityChange(voucher.title, e.target.value)} 
                                        style={{ 
                                            width: isMobile ? '60px' : '50px', 
                                            padding: isMobile ? '8px 6px' : '4px 6px', 
                                            border: '1px solid #ddd', 
                                            borderRadius: 4, 
                                            fontSize: isMobile ? 14 : 13, 
                                            textAlign: 'center',
                                            minHeight: isMobile ? '40px' : 'auto'
                                        }} 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleQuantityChange(voucher.title, getNextAllowedPassenger(parseInt(quantities[voucher.title] || 2, 10), 'next'))}
                                        style={{ 
                                            padding: isMobile ? '8px 12px' : '4px 8px', 
                                            border: '1px solid #ddd', 
                                            background: '#f9f9f9', 
                                            borderRadius: 4, 
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '14px' : '14px',
                                            minHeight: isMobile ? '40px' : 'auto',
                                            minWidth: isMobile ? '40px' : 'auto'
                                        }}
                                    >
                                        +
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') ? 6 : 10, color: '#4a4a4a' }}>
                        {(() => {
                            const isAnyDay = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('any day');
                            const isSharedFlight = chooseFlightType?.type === 'Shared Flight';
                            const weatherRefundEnabled = isSharedFlight && isAnyDay && localSharedWeatherRefund;
                            
                            if (chooseFlightType?.type === "Private Charter") {
                                return `£${(privateCharterDisplayTotal || 0)} total`;
                            } else if (voucher.priceUnit === 'total') {
                                return `£${voucher.price} total`;
                            } else {
                                const basePrice = voucher.basePrice || voucher.price;
                                if (weatherRefundEnabled) {
                                    const passengerCount = parseInt(quantities[voucher.title] || 2, 10);
                                    const weatherRefundCost = 47.50 * passengerCount;
                                    const totalPrice = (basePrice * passengerCount) + weatherRefundCost;
                                    return `£${totalPrice.toFixed(2)} total`;
                                } else {
                                    return `£${basePrice} pp`;
                                }
                            }
                        })()}
                    </div>
                    {(() => {
                        const isAnyDay = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('any day');
                        const isFlexibleWeekday = voucher.title === 'Flexible Weekday';
                        const isWeekdayMorning = voucher.title === 'Weekday Morning';
                        const showWeatherRefundableShared = chooseFlightType?.type === 'Shared Flight' && activitySelect === 'Book Flight' && isAnyDay;
                        const showWeatherRefundablePrivate = chooseFlightType?.type === 'Private Charter' && activitySelect === 'Book Flight';
                        
                        // Always render a container div to maintain consistent card height across all vouchers
                        // For desktop shared vouchers, ensure Flexible Weekday and Weekday Morning have same height as Any Day Flight
                        const shouldShowWeatherContainer = showWeatherRefundableShared || showWeatherRefundablePrivate;
                        const isFlexibleOrWeekdayMorning = isFlexibleWeekday || isWeekdayMorning;
                        const isSharedFlight = chooseFlightType?.type === 'Shared Flight';
                        
                        return (
                            <div style={{
                                background: showWeatherRefundableShared || showWeatherRefundablePrivate ? '#f8fafc' : 'transparent',
                                border: showWeatherRefundableShared || showWeatherRefundablePrivate ? '1px solid #e5e7eb' : 'none',
                                borderRadius: 12,
                                padding: showWeatherRefundableShared || showWeatherRefundablePrivate ? '10px 12px' : '0',
                                marginBottom: shouldShowWeatherContainer ? 10 : 0,
                                // On desktop shared flight, ensure Flexible Weekday and Weekday Morning have same height as Any Day Flight
                                // Any Day Flight with weather toggle takes ~90px, so reserve same space for Flexible Weekday and Weekday Morning
                                minHeight: (!isMobile && isSharedFlight && isFlexibleOrWeekdayMorning && !shouldShowWeatherContainer) ? '0px' :
                                          (isMobile && (isFlexibleWeekday || isWeekdayMorning)) ? '90px' : 
                                          (showWeatherRefundableShared || showWeatherRefundablePrivate ? '50px' : 0),
                                overflow: 'visible',
                                position: 'relative'
                            }}>
                                {showWeatherRefundableShared && (() => {
                                    const enabled = localSharedWeatherRefund;
                                    return (
                                        <>
                                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:enabled ? 6 : 0,overflow:'visible'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:6,overflow:'visible'}}>
                                                    <span style={{fontWeight:600,fontSize:14}}>Weather Refundable</span>
                                                    <BsInfoCircle 
                                                        data-tooltip-id="weather-refundable-tooltip-shared"
                                                        style={{ color: '#3b82f6', cursor: 'pointer', width: 14, height: 14 }} 
                                                    />
                                                    <ReactTooltip
                                                        id="weather-refundable-tooltip-shared"
                                                        place="top"
                                                        content={enabled 
                                                            ? "Fly within 6 attempts, or we'll extend your voucher free of charge - TO - Alternatively, you may request a refund within 6 months of purchase."
                                                            : "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                                                        }
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
                                                </div>
                                                <label className="switch" style={{margin:0}}>
                                                    <input
                                                        type="checkbox"
                                                        checked={enabled}
                                                        onChange={() => {
                                                            const next = !enabled;
                                                            setLocalSharedWeatherRefund(next);
                                                            if (Array.isArray(passengerData) && setPassengerData) {
                                                                const updated = passengerData.map((p)=> ({...p, weatherRefund: next}));
                                                                setPassengerData(updated);
                                                            }
                                                        }}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            {enabled && (
                                                <div style={{textAlign:'right'}}>
                                                    <span className="toggle-price-pill">
                                                        +£{(47.50 * (parseInt(quantities[voucher.title] || 2, 10))).toFixed(2)} total
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                {showWeatherRefundablePrivate && (() => {
                                    const enabled = !!privateWeatherRefundByVoucher[voucher.title];
                                    return (
                                        <>
                                            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:enabled ? 6 : 0,overflow:'visible'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:6,overflow:'visible'}}>
                                                    <span style={{fontWeight:600,fontSize:14}}>Weather Refundable</span>
                                                    <BsInfoCircle 
                                                        data-tooltip-id={`weather-refundable-tooltip-private-${voucher.title}`}
                                                        style={{ color: '#3b82f6', cursor: 'pointer', width: 14, height: 14 }} 
                                                    />
                                                    <ReactTooltip
                                                        id={`weather-refundable-tooltip-private-${voucher.title}`}
                                                        place="top"
                                                        content={enabled 
                                                            ? "Fly within 6 attempts, or we'll extend your voucher free of charge - TO - Alternatively, you may request a refund within 6 months of purchase."
                                                            : "Optional weather protection: If your flight is cancelled due to weather, this cover refunds your flight price (excluding the cost of protection). Without it, your voucher is non-refundable but can be rebooked as needed."
                                                        }
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
                                                </div>
                                                <label className="switch" style={{margin:0}}>
                                                    <input
                                                        type="checkbox"
                                                        checked={enabled}
                                                        onChange={() => {
                                                            const next = !enabled;
                                                            // Enforce mutual exclusivity across voucher items
                                                            setPrivateWeatherRefundByVoucher(() => {
                                                                const state = {};
                                                                if (next) state[voucher.title] = true; // only this one on
                                                                return state; // all others implicitly off
                                                            });
                                                            // If this card is selected, reflect to global for summary
                                                            if (isSelected && setPrivateCharterWeatherRefund) {
                                                                setPrivateCharterWeatherRefund(next);
                                                            }
                                                        }}
                                                    />
                                                    <span className="slider round"></span>
                                                </label>
                                            </div>
                                            {enabled && (
                                                <div style={{textAlign:'right'}}>
                                                    <span className="toggle-price-pill">+ 10%</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        );
                    })()}
                    <button 
                        style={{ 
                            width: '100%', 
                            background: isSelected ? '#00c24a' : '#00eb5b', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 8, 
                            padding: '10px 0', 
                            fontSize: 15, 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            marginTop: (activitySelect === 'Flight Voucher' || activitySelect === 'Buy Gift') ? 8 : 'auto', 
                            transition: 'background 0.2s' 
                        }} 
                        onMouseEnter={(e) => e.target.style.background = '#00c24a'} 
                        onMouseLeave={(e) => e.target.style.background = isSelected ? '#00c24a' : '#00eb5b'} 
                        onClick={() => onSelect(voucher)}
                    >
                        {isSelected ? 'Selected' : 'Select'}
                    </button>
                </div>
            </div>
        );
    };

    // Keep layout sensible per device and experience type

    const handlePrevVoucher = () => {
        if (!isMobile) return;
        
        const container = voucherContainerRef.current;
        if (!container) return;
        
    const firstChild = container.children[0];
    const gap = 12;
    const itemWidth = firstChild ? firstChild.getBoundingClientRect().width + gap : container.clientWidth;
    const newLeft = Math.max(0, container.scrollLeft - itemWidth);
    container.scrollTo({ left: newLeft, behavior: 'smooth' });
    // Optimistically update index/arrows so back button appears immediately
    const itemCount = container.children.length;
    setCurrentItemIndex(prev => Math.max(0, prev - 1));
    const tempIndex = Math.max(0, currentItemIndex - 1);
    setCanScrollVouchersLeft(tempIndex > 0);
    setCanScrollVouchersRight(tempIndex < itemCount - 1);
    };

    const handleNextVoucher = () => {
        if (!isMobile) return;
        
        const container = voucherContainerRef.current;
        if (!container) return;
        
    const firstChild = container.children[0];
    const gap = 12;
    const itemWidth = firstChild ? firstChild.getBoundingClientRect().width + gap : container.clientWidth;
    const newLeft = container.scrollLeft + itemWidth;
    container.scrollTo({ left: newLeft, behavior: 'smooth' });
    // Optimistically update index/arrows so back button appears immediately
    const itemCount = container.children.length;
    setCurrentItemIndex(prev => Math.min(prev + 1, itemCount - 1));
    const tempIndex = Math.min(currentItemIndex + 1, itemCount - 1);
    setCanScrollVouchersLeft(tempIndex > 0);
    setCanScrollVouchersRight(tempIndex < itemCount - 1);
    };

    /**
     * Helper to build a fully-populated voucher object with quantity and pricing.
     * This is shared between manual card selection and deep-link (Shopify) prefill.
     */
    const buildVoucherWithQuantity = (voucher, quantityRaw) => {
        // Ensure quantity defaults to 2 when not explicitly changed in UI
        // For Proposal Flight, force quantity to 2
        const isProposal = typeof voucher.title === 'string' && voucher.title.toLowerCase().includes('proposal');
        const safeQuantity = isProposal
            ? 2
            : (parseInt(quantityRaw ?? quantities[voucher.title] ?? 2, 10) || 2);

        // Calculate total price based on price unit and experience type
        let totalPrice;
        let effectiveBasePrice = voucher.basePrice;

        if (chooseFlightType?.type === "Private Charter") {
            // Use total price from activity tiered pricing; do NOT multiply by passenger count
            const getTieredGroupPrice = (pricingDataRaw, voucherTitleRaw, passengers) => {
                if (pricingDataRaw == null) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') pricingData = JSON.parse(pricingData);
                } catch {
                    return undefined;
                }
                // Ensure we have an object map; guard against null or arrays
                if (pricingData == null || typeof pricingData !== 'object' || Array.isArray(pricingData)) return undefined;

                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);
                let value = undefined;
                const resolveForTitle = (obj, title) => {
                    if (!obj || typeof obj !== 'object') return undefined;
                    if (obj[title] != null) return obj[title];
                    if (obj[title?.trim?.()] != null) return obj[title.trim()];
                    for (const k of Object.keys(obj)) {
                        if (normalize(k) === titleNorm) return obj[k];
                    }
                    return undefined;
                };
                const byTitle = resolveForTitle(pricingData, voucherTitleRaw);
                if (byTitle == null) return undefined;
                if (typeof byTitle === 'object') {
                    const key = String([2,3,4,8].includes(passengers) ? passengers : 2);
                    value = byTitle[key] ?? byTitle['2'];
                } else {
                    value = byTitle; // backward compatible single price (treated as pp)
                }
                const parsed = parseFloat(value);
                return Number.isNaN(parsed) ? undefined : parsed;
            };

            const tierPrice = getTieredGroupPrice(activityData?.private_charter_pricing, voucher.title, safeQuantity);
            if (tierPrice !== undefined) {
                effectiveBasePrice = tierPrice;
            }

            totalPrice = (effectiveBasePrice || 0);
            console.log('VoucherType: Private Charter total pricing (no per-passenger multiply):', totalPrice);
        } else if (voucher.priceUnit === 'total') {
            // For total pricing, the price is already the total for the group
            totalPrice = voucher.price;
            console.log('VoucherType: Using total pricing:', totalPrice);
        } else {
            // For per-person pricing, multiply by quantity
            totalPrice = voucher.price * safeQuantity;
            console.log('VoucherType: Using per-person pricing:', voucher.price, '×', safeQuantity, '=', totalPrice);
        }

        return {
            ...voucher,
            quantity: safeQuantity,
            totalPrice: totalPrice,
            basePrice: effectiveBasePrice || voucher.basePrice,
            priceUnit: voucher.priceUnit,
            // Ensure summary uses the correct total price for Private Charter
            price: (chooseFlightType?.type === "Private Charter") ? totalPrice : (voucher.priceUnit === 'total' ? voucher.price : (voucher.basePrice || voucher.price))
        };
    };

    const openTermsForVoucher = async (voucherObj) => {
        // Ensure selected voucher is set before opening terms
        setSelectedVoucher(voucherObj);

        try {
            setTermsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    // Find active terms mapped to this voucher type. Prefer lowest sort_order, then newest.
                    const matches = json.data.filter(t => {
                        try {
                            // Check if this voucher type is directly mapped
                            if (t.voucher_type_id && Number(t.voucher_type_id) === Number(voucherObj.id)) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is in voucher_type_ids array
                            let voucherTypeIds = [];
                            if (t.voucher_type_ids) {
                                if (Array.isArray(t.voucher_type_ids)) {
                                    voucherTypeIds = t.voucher_type_ids;
                                } else {
                                    try {
                                        voucherTypeIds = JSON.parse(t.voucher_type_ids);
                                    } catch (e) {
                                        voucherTypeIds = [];
                                    }
                                }
                            }
                            if (Array.isArray(voucherTypeIds) && voucherTypeIds.map(Number).includes(Number(voucherObj.id))) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is in private_voucher_type_ids array (for Private Charter)
                            let privateVoucherTypeIds = [];
                            if (t.private_voucher_type_ids) {
                                if (Array.isArray(t.private_voucher_type_ids)) {
                                    privateVoucherTypeIds = t.private_voucher_type_ids;
                                } else {
                                    try {
                                        privateVoucherTypeIds = JSON.parse(t.private_voucher_type_ids);
                                    } catch (e) {
                                        privateVoucherTypeIds = [];
                                    }
                                }
                            }
                            if (Array.isArray(privateVoucherTypeIds) && privateVoucherTypeIds.map(Number).includes(Number(voucherObj.id))) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is for Private Charter experience
                            let experienceIds = [];
                            if (t.experience_ids) {
                                if (Array.isArray(t.experience_ids)) {
                                    experienceIds = t.experience_ids;
                                } else {
                                    try {
                                        experienceIds = JSON.parse(t.experience_ids);
                                    } catch (e) {
                                        experienceIds = [];
                                    }
                                }
                            }
                            if (chooseFlightType?.type === 'Private Charter' && Array.isArray(experienceIds) && experienceIds.length > 0) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check title match
                            if (t.voucher_type_title) {
                                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                                if (normalize(t.voucher_type_title) === normalize(voucherObj.title)) {
                                    return (t.is_active === 1 || t.is_active === true);
                                }
                            }
                            
                            // If no mapping info, skip
                            return false;
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    // Sort matches: 1) lowest sort_order; 2) newest updated_at
                    matches.sort((a, b) => {
                        const sortA = a.sort_order != null ? Number(a.sort_order) : 9999;
                        const sortB = b.sort_order != null ? Number(b.sort_order) : 9999;
                        if (sortA !== sortB) return sortA - sortB;
                        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
                        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
                        return dateB - dateA; // newest first
                    });
                    
                    const selectedTerms = matches.length > 0 ? matches[0].content : '';
                    console.log('VoucherType: Selected Terms & Conditions:', selectedTerms ? selectedTerms.substring(0, 100) + '...' : 'none');
                    setTermsContent(selectedTerms || voucherObj.weatherClause || '');
                } else {
                    setTermsContent(voucherObj.weatherClause || '');
                }
            } else {
                setTermsContent(voucherObj.weatherClause || '');
            }
        } catch (e) {
            setTermsContent(voucherObj.weatherClause || '');
        } finally {
            setTermsLoading(false);
            setShowTerms(true);
        }
    };

    const handleSelectVoucher = async (voucher) => {
        const voucherWithQuantity = buildVoucherWithQuantity(voucher);
        
        console.log('VoucherType: handleSelectVoucher called with:', voucher);
        console.log('VoucherType: Created voucherWithQuantity:', voucherWithQuantity);
        setSelectedVoucher(voucherWithQuantity);
        
        // Fetch Terms & Conditions for this voucher type from backend Settings
        try {
            setTermsLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/terms-and-conditions`);
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    // Find active terms mapped to this voucher type. Prefer lowest sort_order, then newest.
                    const matches = json.data.filter(t => {
                        try {
                            // Check if this voucher type is directly mapped
                            if (t.voucher_type_id && Number(t.voucher_type_id) === Number(voucher.id)) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is in voucher_type_ids array
                            let voucherTypeIds = [];
                            if (t.voucher_type_ids) {
                                if (Array.isArray(t.voucher_type_ids)) {
                                    voucherTypeIds = t.voucher_type_ids;
                                } else {
                                    try {
                                        voucherTypeIds = JSON.parse(t.voucher_type_ids);
                                    } catch (e) {
                                        voucherTypeIds = [];
                                    }
                                }
                            }
                            if (Array.isArray(voucherTypeIds) && voucherTypeIds.map(Number).includes(Number(voucher.id))) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is in private_voucher_type_ids array (for Private Charter)
                            let privateVoucherTypeIds = [];
                            if (t.private_voucher_type_ids) {
                                if (Array.isArray(t.private_voucher_type_ids)) {
                                    privateVoucherTypeIds = t.private_voucher_type_ids;
                                } else {
                                    try {
                                        privateVoucherTypeIds = JSON.parse(t.private_voucher_type_ids);
                                    } catch (e) {
                                        privateVoucherTypeIds = [];
                                    }
                                }
                            }
                            if (Array.isArray(privateVoucherTypeIds) && privateVoucherTypeIds.map(Number).includes(Number(voucher.id))) {
                                return (t.is_active === 1 || t.is_active === true);
                            }
                            
                            // Check if this voucher type is for Private Charter experience
                            let experienceIds = [];
                            if (t.experience_ids) {
                                if (Array.isArray(t.experience_ids)) {
                                    experienceIds = t.experience_ids;
                                } else {
                                    try {
                                        experienceIds = JSON.parse(t.experience_ids);
                                    } catch (e) {
                                        experienceIds = [];
                                    }
                                }
                            }
                            if (Array.isArray(experienceIds) && experienceIds.includes(2)) { // 2 = Private Charter
                                // Check if this voucher type matches the selected voucher
                                let voucherTypeIds = [];
                                if (t.voucher_type_ids) {
                                    if (Array.isArray(t.voucher_type_ids)) {
                                        voucherTypeIds = t.voucher_type_ids;
                                    } else {
                                        try {
                                            voucherTypeIds = JSON.parse(t.voucher_type_ids);
                                        } catch (e) {
                                            voucherTypeIds = [];
                                        }
                                    }
                                }
                                
                                let privateVoucherTypeIds = [];
                                if (t.private_voucher_type_ids) {
                                    if (Array.isArray(t.private_voucher_type_ids)) {
                                        privateVoucherTypeIds = t.private_voucher_type_ids;
                                    } else {
                                        try {
                                            privateVoucherTypeIds = JSON.parse(t.private_voucher_type_ids);
                                        } catch (e) {
                                            privateVoucherTypeIds = [];
                                        }
                                    }
                                }
                                
                                if (Array.isArray(voucherTypeIds) && voucherTypeIds.map(Number).includes(Number(voucher.id))) {
                                    return (t.is_active === 1 || t.is_active === true);
                                }
                                
                                if (Array.isArray(privateVoucherTypeIds) && privateVoucherTypeIds.map(Number).includes(Number(voucher.id))) {
                                    return (t.is_active === 1 || t.is_active === true);
                                }
                            }
                            
                            return false;
                        } catch { return false; }
                    }).sort((a,b) => {
                        const so = (a.sort_order ?? 0) - (b.sort_order ?? 0);
                        if (so !== 0) return so;
                        return new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0);
                    });
                    const content = matches[0]?.content || '';
                    setTermsContent(content);
                }
            }
        } catch (e) {
            setTermsContent(voucher.weatherClause || '');
        } finally {
            setTermsLoading(false);
            setShowTerms(true);
        }
    };

    // Remove the condition that hides VoucherType for Private Charter
    // Both Shared Flight and Private Charter should be able to access voucher types

    return (
        <>
            {/* Notification for voucher type selection */}
            {showNotification && (
                <div style={{
                    position: 'fixed',
                    [isMobile ? 'top' : 'bottom']: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgb(3, 169, 244)',
                    color: 'white',
                    padding: isMobile ? '8px 16px' : '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    zIndex: 9999,
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: isMobile ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-out',
                    maxWidth: '90vw',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: isMobile ? '16px' : '18px' }}>✓</span>
                    {notificationMessage}
                </div>
            )}
            
            <style>{scrollbarStyles}</style>
            <Accordion
                title={
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', gap: '8px' }}>
                        <span>Voucher Type</span>
                    </div>
                }
                id="voucher-type"
                activeAccordion={activeAccordion}
                setActiveAccordion={setActiveAccordion}
                isDisabled={isDisabled}
            >
                {showTerms && selectedVoucher && (
                    <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                        <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:720,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)'}}>
                            <div style={{display:'flex',justifyContent:'center',alignItems:'center',marginBottom:12}}>
                                <h4 style={{margin:0,fontSize:20,fontWeight:700,color:'#111827',textAlign:'center'}}>Terms & Conditions</h4>
                            </div>
                            <div style={{maxHeight:360,overflowY:'auto',whiteSpace:'pre-line',color:'#374151',lineHeight:1.6,fontSize:14,border:'1px solid #e5e7eb',borderRadius:8,padding:'12px 14px',background:'#f9fafb'}}>
                                {termsLoading ? 'Loading terms...' : (termsContent || selectedVoucher?.weatherClause || '')}
                            </div>
                            <div style={{display:'flex',justifyContent:'center',gap:10,marginTop:16}}>
                                <button onClick={() => { setShowTerms(false); }} style={{border:'1px solid #d1d5db',background:'#fff',color:'#374151',padding:'8px 14px',borderRadius:8,cursor:'pointer',fontSize:'14px',fontWeight:'500'}}>Choose Different Voucher</button>
                                <button onClick={() => { 
                                    console.log('VoucherType: Confirm button clicked, setting selectedVoucherType:', selectedVoucher);
                                    setSelectedVoucherType(selectedVoucher); 
                                    setShowTerms(false);
                                    
                                    // Show notification for voucher type selection after confirmation
                                    setNotificationMessage(`${selectedVoucher?.title} Selected`);
                                    setShowNotification(true);
                                    
                                    // Auto-hide notification after 3 seconds
                                    setTimeout(() => {
                                        setShowNotification(false);
                                    }, 3000);
                                    
                                            // Trigger section completion after state update
        setTimeout(() => {
            if (onSectionCompletion) {
                console.log('🎫 VoucherType: Calling onSectionCompletion for voucher-type');
                onSectionCompletion('voucher-type');
            }
        }, 300); // Longer delay to ensure state is fully updated
                                }} style={{background:'#00eb5b',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none',fontSize:'14px',fontWeight:'500'}} disabled={termsLoading}>Agree and Proceed</button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Have booking questions - compact section */}
                <div style={{
                    background: 'rgb(248, 250, 252)',
                    padding: isMobile ? '12px 16px' : '16px 20px',
                    borderRadius: '8px',
                    margin: isMobile ? '0 0 16px 0' : '0 0 20px 0',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: '200',
                        color: 'rgb(102, 102, 102)',
                        marginBottom: '10px',
                        margin: '0 0 10px 0'
                    }}>
                        Have booking questions?
                    </p>
                    
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '8px' : '12px',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <a 
                            href="tel:+441823778127"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: isMobile ? '8px 14px' : '10px 16px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: '#03A9F4',
                                boxShadow: 'none',
                                fontWeight: '500',
                                fontSize: isMobile ? '13px' : '14px',
                                transition: 'transform 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color: '#03A9F4' }}>
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            <span>+44 1823 778 127</span>
                        </a>

                        <a 
                            href="http://wa.me/message/CQZBMWVAP2LWM1"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: isMobile ? '8px 14px' : '10px 16px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                color: '#03A9F4',
                                boxShadow: 'none',
                                fontWeight: '500',
                                fontSize: isMobile ? '13px' : '14px',
                                transition: 'transform 0.2s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color: '#03A9F4' }}>
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span>Chat</span>
                        </a>
                    </div>
                </div>

                {/* Voucher Type Selection - wrapped with local container under panel */}
                <div style={{ width:'100%', maxWidth:960, margin:'0 auto' }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    minHeight: '400px'
                }}>

                    {/* Removed old left-side Private Charter weather refundable banner */}
                    {(() => {
                        if (privateCharterVoucherTypesLoading || allVoucherTypesLoading || activityDataLoading) {
                            return (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Loading Voucher Types...</h3>
                                </div>
                            );
                        }

                        if (voucherTypes.length === 0) {
                            return (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎈</div>
                                    <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Voucher Types Available</h3>
                                    <p style={{ color: '#9ca3af' }}>
                                        {chooseFlightType?.type === "Private Charter" 
                                            ? "No private charter voucher types are currently available for this location."
                                            : "No shared flight voucher types are currently available for this location."
                                        }
                                    </p>
                                </div>
                            );
                        }

                        // For Private Charter, show navigation and all voucher types
                        if (chooseFlightType?.type === "Private Charter") {
                            const activeVouchers = voucherTypes.filter(vt => vt.is_active !== false);
                            
                            if (activeVouchers.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎈</div>
                                        <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Active Voucher Types</h3>
                                        <p style={{ color: '#9ca3af' }}>All private charter voucher types are currently inactive.</p>
                                    </div>
                                );
                            }

                            // Desktop pagination helpers
                            const pageSize = 2; // desktop shows 2 private charter vouchers per page
                            const startIndex = currentViewIndex * pageSize;
                            let vouchersToShow = [];
                            
                            // For mobile devices, show all vouchers in single container like PassengerInfo
                            if (isMobile) {
                                return (
                                    <div style={{ 
                                        position: 'relative',
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center'
                                    }}>
                                        {/* Navigation Arrows (mobile) - hide back on first, next on last */}
                                        {isMobile && activeVouchers.length > 1 && (
                                            <>
                                                {/* Left Arrow - show only after first item on mobile */}
                                                {(currentItemIndex > 0) && (
                                                    <div style={{
                                                        position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                        background: 'rgb(3, 169, 244)', borderRadius: '50%', width: isMobile ? 36 : 56, height: isMobile ? 36 : 56,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        opacity: 1,
                                                        boxShadow: '0 3px 10px rgba(0,0,0,0.18)', border: 'none'
                                                    }} onClick={handlePrevVoucher}>
                                                        <span style={{ fontSize: isMobile ? 27 : 32, color: '#fff', margin: 0, lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>‹</span>
                                                    </div>
                                                )}
                                                {/* Right Arrow - hide on last item on mobile */}
                                                {(currentItemIndex < activeVouchers.length - 1) && (
                                                    <div style={{
                                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                        background: 'rgb(3, 169, 244)', borderRadius: '50%', width: isMobile ? 48 : 56, height: isMobile ? 48 : 56,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                        boxShadow: '0 3px 10px rgba(0,0,0,0.18)', border: 'none'
                                                    }} onClick={handleNextVoucher}>
                                                        <span style={{ fontSize: isMobile ? 27 : 32, color: '#fff', margin: 0, lineHeight: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>›</span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Voucher Cards Container - Single container like PassengerInfo */}
                                        <div ref={voucherContainerRef} className="voucher-cards-container" style={{ 
                                            display: 'flex', 
                                            flexDirection: 'row', 
                                            gap: '16px', 
                                            justifyContent: 'flex-start',
                                            alignItems: 'stretch',
                                            width: '100%',
                                            overflowX: 'auto',
                                            overflowY: 'visible',
                                            paddingBottom: '10px',
                                            scrollBehavior: 'smooth',
                                            scrollSnapType: 'x mandatory',
                                            scrollPadding: isMobile ? '0 6px' : '0 8px',
                                            WebkitOverflowScrolling: 'touch',
                                            overscrollBehavior: 'contain',
                                            position: 'relative'
                                        }}>
                                            {activeVouchers.map((voucher, index) => (
                                                <div key={voucher.id || index} style={{
                                                    // On mobile, match shared vouchers width structure
                                                    width: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                    minWidth: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                    maxWidth: isMobile ? 'calc(100% - 0px)' : 'none',
                                                    flexShrink: 0,
                                                    scrollSnapAlign: 'start',
                                                    display: 'flex',
                                                    height: '100%'
                                                }}>
                                                    <VoucherCard
                                                        voucher={voucher}
                                                        isSelected={selectedVoucherType?.id === voucher.id}
                                                        onSelect={handleSelectVoucher}
                                                        quantities={quantities}
                                                        onQuantityChange={handleQuantityChange}
                                                        chooseFlightType={chooseFlightType}
                                                        isMobile={isMobile}
                                                        shouldAnimate={shouldAnimate}
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                );
                            } else {
                                vouchersToShow = activeVouchers.slice(startIndex, startIndex + pageSize);
                            }

                            return (
                                <>
                                    {/* Navigation Arrows - Desktop Only */}
                                    {(!isMobile && activeVouchers.length > pageSize) && (
                                        <>
                                            {/* Left Arrow */}
                                            {currentViewIndex > 0 && (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: 20, 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)', 
                                                    zIndex: 10,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    borderRadius: '50%',
                                                    width: 40,
                                                    height: 40,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    border: '1px solid #ddd',
                                                    transition: 'all 0.2s ease'
                                                }} onClick={() => setCurrentViewIndex(Math.max(0, currentViewIndex - 1))}>
                                                    <span style={{ fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</span>
                                                </div>
                                            )}
                                            
                                            {/* Right Arrow */}
                                            {(startIndex + pageSize) < activeVouchers.length && (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    right: 20, 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)', 
                                                    zIndex: 10,
                                                    background: 'rgba(255,255,255,0.9)',
                                                    borderRadius: '50%',
                                                    width: 40,
                                                    height: 40,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    border: '1px solid #ddd',
                                                    transition: 'all 0.2s ease'
                                                }} onClick={() => setCurrentViewIndex(Math.min(currentViewIndex + 1, Math.ceil(activeVouchers.length / pageSize) - 1))}>
                                                    <span style={{ fontSize: 18, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Voucher Cards */}
                                    <div ref={isMobile ? voucherContainerRef : undefined} className="voucher-cards-container" style={{ 
                                        display: 'flex', 
                                        flexDirection: isMobile ? 'row' : 'row', 
                                        gap: isMobile ? '16px' : '20px', 
                                        justifyContent: isMobile ? 'flex-start' : 'center',
                                        alignItems: 'stretch',
                                        width: '100%',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        paddingBottom: isMobile ? '10px' : '0',
                                        scrollBehavior: 'smooth',
                                        scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                        scrollPadding: isMobile ? '0 6px' : '0',
                                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                                        overscrollBehavior: isMobile ? 'contain' : 'auto'
                                    }}>
                                        {vouchersToShow.map((voucher, index) => (
                                            <div key={`wrapper-${voucher.id}-${currentViewIndex}-${index}`} style={{
                                                // On mobile, match private charter width structure for consistency
                                                width: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                minWidth: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                maxWidth: isMobile ? 'calc(100% - 0px)' : 'none',
                                                display: 'flex',
                                                height: '100%',
                                                flexShrink: 0
                                            }}>
                                                <VoucherCard
                                                    key={`${voucher.id}-${currentViewIndex}-${index}`}
                                                    voucher={voucher}
                                                    onSelect={handleSelectVoucher}
                                                    quantities={quantities}
                                                    setQuantities={setQuantities}
                                                    isSelected={selectedVoucher?.id === voucher.id}
                                                    slideDirection={slideDirection}
                                                    showTwoVouchers={vouchersToShow.length > 1}
                                                    shouldAnimate={shouldAnimate}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                </>
                            );
                        } else {
                            // For Shared Flight, use existing logic
                            const filteredVouchers = voucherTypes.filter(voucher => 
                                availableVoucherTypes.length === 0 || availableVoucherTypes.includes(voucher.title)
                            );
                            
                            if (filteredVouchers.length === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎈</div>
                                        <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>No Available Voucher Types</h3>
                                        <p style={{ color: '#9ca3af' }}>No voucher types are currently available for the selected location.</p>
                                    </div>
                                );
                            }

                            // Desktop pagination: show 2 per page (third via next/back)
                            const sfPageSize = 2;
                            const sfStartIndex = currentViewIndex * sfPageSize;
                            let vouchersToShow = [];
                            
                            // For mobile devices, show all vouchers for horizontal scroll
                            if (isMobile) {
                                vouchersToShow = filteredVouchers;
                            } else {
                                vouchersToShow = filteredVouchers.slice(sfStartIndex, sfStartIndex + sfPageSize);
                            }

                            return (
                                <>
                                    {/* Navigation Arrows - Desktop only */}
                                    {(!isMobile && filteredVouchers.length > sfPageSize) && (
                                        <>
                                            {/* Left Arrow */}
                                            {currentViewIndex > 0 && (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: 20, 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)', 
                                                    zIndex: 10,
                                                    background: 'rgb(3, 169, 244)',
                                                    borderRadius: '50%',
                                                    width: 40,
                                                    height: 40,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    transition: 'all 0.2s ease'
                                                }} onClick={() => setCurrentViewIndex(Math.max(0, currentViewIndex - 1))}>
                                                    <ArrowBackIosIcon style={{ fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                                </div>
                                            )}
                                            
                                            {/* Right Arrow */}
                                            {(sfStartIndex + sfPageSize) < filteredVouchers.length && (
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    right: 20, 
                                                    top: '50%', 
                                                    transform: 'translateY(-50%)', 
                                                    zIndex: 10,
                                                    background: 'rgb(3, 169, 244)',
                                                    borderRadius: '50%',
                                                    width: 40,
                                                    height: 40,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    transition: 'all 0.2s ease'
                                                }} onClick={() => setCurrentViewIndex(Math.min(currentViewIndex + 1, Math.ceil(filteredVouchers.length / sfPageSize) - 1))}>
                                                    <ArrowForwardIosIcon style={{ fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Navigation Arrows - Mobile (mirror Experience) */}
                                    {(isMobile && filteredVouchers.length > 1) && (
                                        <>
                                            {/* Left Arrow (mobile) - show only after first item */}
                                            {(currentItemIndex > 0) && (
                                                <div style={{
                                                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 36, height: 36,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    opacity: 1,
                                                    boxShadow: '0 3px 10px rgba(0,0,0,0.18)', border: 'none'
                                                }} onClick={handlePrevVoucher}>
                                                    <span style={{ fontSize: 27, color: '#fff', margin: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-3px' }}>‹</span>
                                                </div>
                                            )}
                                            {/* Right Arrow (mobile) - hide on last item */}
                                            {(currentItemIndex < filteredVouchers.length - 1) && (
                                                <div style={{
                                                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 36, height: 36,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    opacity: 1,
                                                    boxShadow: '0 3px 10px rgba(0,0,0,0.18)', border: 'none'
                                                }} onClick={handleNextVoucher}>
                                                    <span style={{ fontSize: 27, color: '#fff', margin: 0, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-3px' }}>›</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Voucher Cards */}
                                    <div ref={isMobile ? voucherContainerRef : undefined} className="voucher-cards-container" style={{ 
                                        display: 'flex', 
                                        flexDirection: isMobile ? 'row' : 'row', 
                                        gap: isMobile ? '16px' : '20px', 
                                        justifyContent: isMobile ? 'flex-start' : 'center',
                                        alignItems: 'stretch',
                                        width: '100%',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        paddingBottom: isMobile ? '10px' : '0',
                                        scrollBehavior: 'smooth',
                                        scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                        scrollPadding: isMobile ? '0 6px' : '0',
                                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                                        overscrollBehavior: isMobile ? 'contain' : 'auto'
                                    }}>
                                        {vouchersToShow.map((voucher, index) => (
                                            <div key={`wrapper-${voucher.id}-${currentViewIndex}-${index}`} style={{
                                                // On mobile, match private charter width structure for consistency
                                                width: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                minWidth: isMobile ? 'calc(100% - 0px)' : 'auto',
                                                maxWidth: isMobile ? 'calc(100% - 0px)' : 'none',
                                                display: 'flex',
                                                height: '100%',
                                                flexShrink: 0
                                            }}>
                                                <VoucherCard
                                                    key={`${voucher.id}-${currentViewIndex}-${index}`}
                                                    voucher={voucher}
                                                    onSelect={handleSelectVoucher}
                                                    quantities={quantities}
                                                    setQuantities={setQuantities}
                                                    isSelected={selectedVoucher?.id === voucher.id}
                                                    slideDirection={slideDirection}
                                                    showTwoVouchers={vouchersToShow.length > 1}
                                                    shouldAnimate={shouldAnimate}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                </>
                            );
                        }
                    })()}
                    </div>
                </div>

                {/* Reputation note under the whole voucher panel */}
                <div style={{ width: '100%', maxWidth: 960, margin: '12px auto 0', textAlign: 'center', color: '#64748b' }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 500 }}>★ Five-star rated by guests on Google, Facebook & TripAdvisor — you'll see why.</span>
                </div>
            </Accordion>

            {/* Capacity Warning Modal */}
            {showCapacityWarning && (
                <div className="modal-overlay" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2000,display:'flex',justifyContent:'center',alignItems:'center'}}>
                    <div className="modal-content" style={{background:'#ffffff',borderRadius:12,maxWidth:420,width:'92%',padding:'20px 24px',boxShadow:'0 10px 40px rgba(0,0,0,0.2)',textAlign:'center'}}>
                        <div style={{fontSize:'48px',marginBottom:'16px'}}>⚠️</div>
                        <h4 style={{margin:0,fontSize:20,fontWeight:700,color:'#dc3545',marginBottom:'12px'}}>Insufficient Capacity</h4>
                        <p style={{color:'#374151',lineHeight:1.5,fontSize:16,marginBottom:'20px'}}>
                            {availableCapacity === 1 ? 
                                `Only ${availableCapacity} space is available for this date and time.` :
                                `Only ${availableCapacity} spaces are available for this date and time.`
                            }
                        </p>
                        <p style={{color:'#6b7280',lineHeight:1.4,fontSize:14,marginBottom:'20px'}}>
                            Please select a different number of passengers or choose another date and time.
                        </p>
                        <button 
                            onClick={() => setShowCapacityWarning(false)} 
                            style={{
                                background:'#dc3545',
                                color:'#fff',
                                padding:'10px 20px',
                                borderRadius:8,
                                cursor:'pointer',
                                border:'none',
                                fontSize:16,
                                fontWeight:600
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Terms & Conditions Modal removed */}
        </>
    );
};

// Custom comparison function to prevent re-render when only passengerCount changes
const areEqual = (prevProps, nextProps) => {
    // Compare all props except for chooseFlightType.passengerCount
    const prevFlightType = prevProps.chooseFlightType?.type;
    const nextFlightType = nextProps.chooseFlightType?.type;
    
    // Check if flight type changed (this should trigger re-render)
    if (prevFlightType !== nextFlightType) {
        return false;
    }
    
    // Check other props that should trigger re-render
    if (prevProps.activeAccordion !== nextProps.activeAccordion ||
        prevProps.selectedVoucherType !== nextProps.selectedVoucherType ||
        prevProps.activitySelect !== nextProps.activitySelect ||
        prevProps.chooseLocation !== nextProps.chooseLocation ||
        prevProps.selectedActivity !== nextProps.selectedActivity) {
        return false;
    }
    
    // If none of the important props changed, don't re-render
    return true;
};

export default memo(VoucherType, areEqual);

// Mobile scroll bar styles
const mobileScrollStyles = `
    @media (max-width: 576px) {
        /* Hide scrollbar for voucher cards container */
        .voucher-cards-container::-webkit-scrollbar {
            display: none;
        }
        
        /* For Firefox */
        .voucher-cards-container {
            scrollbar-width: none;
        }
        
        /* Smooth scrolling */
        .voucher-cards-container {
            -webkit-overflow-scrolling: touch;
        }
    }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = mobileScrollStyles;
    document.head.appendChild(styleElement);
}  