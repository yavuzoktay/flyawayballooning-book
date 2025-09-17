import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
import Accordion from '../Common/Accordion';
import axios from 'axios';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import weekdayMorningImg from '../../../assets/images/category1.jpeg';
import flexibleWeekdayImg from '../../../assets/images/category2.jpeg';
import anyDayFlightImg from '../../../assets/images/category3.jpg';
import config from '../../../config';

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
    onSectionCompletion
}) => {
    const API_BASE_URL = config.API_BASE_URL;
    const [quantities, setQuantities] = useState({});
    const [showTerms, setShowTerms] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [availableVoucherTypes, setAvailableVoucherTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [locationPricing, setLocationPricing] = useState({});
    const [currentViewIndex, setCurrentViewIndex] = useState(0);
    const [showTwoVouchers, setShowTwoVouchers] = useState(true);
    const [slideDirection, setSlideDirection] = useState('right');
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [allVoucherTypes, setAllVoucherTypes] = useState([]);
    const [allVoucherTypesLoading, setAllVoucherTypesLoading] = useState(true);
    const [privateCharterVoucherTypes, setPrivateCharterVoucherTypes] = useState([]);
    const [privateCharterVoucherTypesLoading, setPrivateCharterVoucherTypesLoading] = useState(true);
    const [termsContent, setTermsContent] = useState('');
    const [termsLoading, setTermsLoading] = useState(false);
    const [activityData, setActivityData] = useState(null);
    const [activityDataLoading, setActivityDataLoading] = useState(false);
    const [showCapacityWarning, setShowCapacityWarning] = useState(false);
    
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
    }, [isMobile, allVoucherTypes.length, privateCharterVoucherTypes.length]);

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
                    setAllVoucherTypes(data.data);
                    
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
        if (!chooseLocation) {
            setActivityData(null);
            return;
        }
        
        setActivityDataLoading(true);
        try {
            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const response = await axios.get(`${API_BASE_URL}/api/activities/flight-types?location=${encodeURIComponent(chooseLocation)}&t=${timestamp}`);
            if (response.data.success && response.data.data.length > 0) {
                // Get the first activity for this location
                const activity = response.data.data[0];
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

    const voucherTypes = useMemo(() => {
        // Determine which voucher types to show based on selected experience
        const isPrivateCharter = chooseFlightType?.type === "Private Charter";
        
        console.log('VoucherType: voucherTypes useMemo triggered');
        console.log('VoucherType: chooseFlightType:', chooseFlightType);
        console.log('VoucherType: isPrivateCharter:', isPrivateCharter);
        console.log('VoucherType: allVoucherTypes count:', allVoucherTypes.length);
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
                if (!pricingDataRaw) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') {
                        pricingData = JSON.parse(pricingData);
                    }
                } catch {
                    return undefined;
                }

                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);

                // Direct hits
                if (pricingData[voucherTitleRaw] != null) return pricingData[voucherTitleRaw];
                if (pricingData[voucherTitleRaw?.trim?.()] != null) return pricingData[voucherTitleRaw.trim()];

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
                    features = JSON.parse(vt.features || '[]');
                } catch (e) {
                    // Default features for private charter
                    features = ['Private Balloon', 'Flexible Timing', 'Personalized Experience', 'Complimentary Drinks', 'Professional Photos', '3D Flight Track'];
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
                    refundability: 'Non-Refundable',
                    availability: vt.flight_days || 'Any Day',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
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
            if (allVoucherTypesLoading || allVoucherTypes.length === 0) {
                console.log('VoucherType: Shared Flight - no voucher types available yet');
                return [];
            }

                            console.log('VoucherType: Creating regular voucher types with activityData:', activityData);
                console.log('VoucherType: Creating regular voucher types with locationPricing (fallback):', locationPricing);
                console.log('VoucherType: Raw voucher types data:', allVoucherTypes.map(vt => ({ id: vt.id, title: vt.title, terms: vt.terms })));
            
            // Create voucher types for Shared Flight
            const sharedFlightVouchers = allVoucherTypes.map(vt => {
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
                try {
                    features = JSON.parse(vt.features || '[]');
                } catch (e) {
                    // Default features for shared flight
                    features = ['Shared Balloon', 'Professional Pilot', 'Safety Briefing', 'Flight Certificate'];
                }

                return {
                    id: vt.id,
                    title: vt.title,
                    description: vt.description || 'Shared balloon experience with other passengers. Perfect for individuals and small groups.',
                    image: imageUrl,
                    refundability: 'Non-Refundable',
                    availability: vt.flight_days || 'Any Day',
                    validity: `Valid: ${vt.validity_months || 18} Months`,
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
            console.log('VoucherType: Shared Flight pricing details:', sharedFlightVouchers.map(vt => ({ 
                title: vt.title, 
                basePrice: vt.basePrice, 
                price: vt.price, 
                priceUnit: vt.priceUnit,
                originalPricePerPerson: vt.price_per_person
            })));
            console.log('VoucherType: Final pricing summary for shared flight vouchers:', sharedFlightVouchers.map(vt => ({
                title: vt.title,
                displayPrice: `From £${vt.basePrice} pp`,
                totalPrice: vt.price,
                basePrice: vt.basePrice
            })));
            return sharedFlightVouchers;
        }
    }, [chooseFlightType?.type, allVoucherTypes, allVoucherTypesLoading, privateCharterVoucherTypes, privateCharterVoucherTypesLoading, activityData, locationPricing, API_BASE_URL, chooseLocation]);

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
            const allowedPassengers = [2, 3, 4, 8];
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
                if (!pricingDataRaw) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') pricingData = JSON.parse(pricingData);
                } catch {}
                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);
                const resolveForTitle = (obj, title) => {
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
                width: isMobile ? 'calc(100% - 8px)' : '320px',
                minWidth: isMobile ? 'calc(100% - 8px)' : '320px',
                maxWidth: isMobile ? 'calc(100% - 8px)' : '320px',
                flexShrink: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                animation: shouldAnimate ? (slideDirection === 'right' ? 'slideInRight 0.3s ease-in-out' : slideDirection === 'left' ? 'slideInLeft 0.3s ease-in-out' : 'none') : 'none',
                border: isSelected ? '2px solid #03a9f4' : 'none',
                scrollSnapAlign: isMobile ? 'start' : 'none'
            }}>
                <img
                    src={voucher.image}
                    alt={voucher.title}
                    style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                    }}
                />
                <div style={{ 
                    padding: '16px', 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%' 
                }}>
                    <h3 style={{ fontSize: 18, fontWeight: 300, margin: 0, marginBottom: 6, color: '#4a4a4a' }}>{voucher.title}</h3>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, lineHeight: '1.3', fontStyle: 'italic' }}>{voucher.description}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.refundability}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.availability}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 6, fontWeight: 600 }}>{voucher.flightTime}</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 10, fontWeight: 600 }}>{voucher.validity}</div>
                    <div style={{ paddingLeft: 0, margin: 0, marginBottom: 10, color: '#666', fontSize: isMobile ? 14 : 13, lineHeight: '1.3' }}>
                        {voucher.inclusions.map((inclusion, i) => (
                            <div key={i} style={{ marginBottom: 3 }}>{inclusion}</div>
                        ))}
                    </div>
                    {voucher.weatherClause && activitySelect !== 'Buy Gift' && (
                        <div style={{ fontSize: isMobile ? 14 : 13, color: '#666', marginBottom: 12, lineHeight: '1.2' }}>{voucher.weatherClause}</div>
                    )}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        marginBottom: 12, 
                        gap: isMobile ? '8px' : '8px' 
                    }}>
                        <label style={{ 
                            fontSize: isMobile ? 16 : 13, 
                            color: '#666', 
                            fontWeight: isMobile ? 500 : 500,
                            marginBottom: isMobile ? '4px' : '0'
                        }}>Passengers:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                        chooseFlightType?.type === "Private Charter" ? 8 : (voucher.maxPassengers || 8)
                                    ) : 
                                    (chooseFlightType?.type === "Private Charter" ? 8 : (voucher.maxPassengers || 8))
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
                        </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#4a4a4a' }}>
                        {chooseFlightType?.type === "Private Charter"
                            ? `£${(privateCharterDisplayTotal || 0)} total`
                            : (voucher.priceUnit === 'total'
                                ? `£${voucher.price} total`
                                : `From £${voucher.basePrice || voucher.price} pp`)}
                    </div>
                    <button 
                        style={{ 
                            width: '100%', 
                            background: isSelected ? '#0288d1' : '#03a9f4', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: 8, 
                            padding: '10px 0', 
                            fontSize: 15, 
                            fontWeight: 600, 
                            cursor: 'pointer', 
                            marginTop: 'auto', 
                            transition: 'background 0.2s' 
                        }} 
                        onMouseEnter={(e) => e.target.style.background = '#0288d1'} 
                        onMouseLeave={(e) => e.target.style.background = isSelected ? '#0288d1' : '#03a9f4'} 
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
        container.scrollTo({ left: Math.max(0, container.scrollLeft - itemWidth), behavior: 'smooth' });
    };

    const handleNextVoucher = () => {
        if (!isMobile) return;
        
        const container = voucherContainerRef.current;
        if (!container) return;
        
        const firstChild = container.children[0];
        const gap = 12;
        const itemWidth = firstChild ? firstChild.getBoundingClientRect().width + gap : container.clientWidth;
        container.scrollTo({ left: container.scrollLeft + itemWidth, behavior: 'smooth' });
    };

    const handleSelectVoucher = async (voucher) => {
        const quantity = quantities[voucher.title];
        
        console.log('VoucherType: handleSelectVoucher called with:', voucher);
        console.log('VoucherType: Quantity for', voucher.title, ':', quantity);
        
        // Calculate total price based on price unit and experience type
        let totalPrice;
        let effectiveBasePrice = voucher.basePrice;
        if (chooseFlightType?.type === "Private Charter") {
            // Use total price from activity tiered pricing; do NOT multiply by passenger count
            const getTieredGroupPrice = (pricingDataRaw, voucherTitleRaw, passengers) => {
                if (!pricingDataRaw) return undefined;
                let pricingData = pricingDataRaw;
                try {
                    if (typeof pricingData === 'string') pricingData = JSON.parse(pricingData);
                } catch {}
                const normalize = (s) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
                const titleNorm = normalize(voucherTitleRaw);
                let value = undefined;
                const resolveForTitle = (obj, title) => {
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

            const tierPrice = getTieredGroupPrice(activityData?.private_charter_pricing, voucher.title, quantity);
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
            totalPrice = voucher.price * quantity;
            console.log('VoucherType: Using per-person pricing:', voucher.price, '×', quantity, '=', totalPrice);
        }
        
        const voucherWithQuantity = {
            ...voucher,
            quantity: quantity,
            totalPrice: totalPrice,
            basePrice: effectiveBasePrice || voucher.basePrice,
            priceUnit: voucher.priceUnit,
            // Ensure summary uses the correct total price for Private Charter
            price: (chooseFlightType?.type === "Private Charter") ? totalPrice : (voucher.priceUnit === 'total' ? voucher.price : (voucher.basePrice || voucher.price))
        };
        
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
                    backgroundColor: '#4CAF50',
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
                        {(privateCharterVoucherTypesLoading || allVoucherTypesLoading || activityDataLoading) && (
                            <span style={{ fontSize: '12px', color: '#6b7280' }}>🔄</span>
                        )}
                    </div>
                }
                id="voucher-type"
                activeAccordion={activeAccordion}
                setActiveAccordion={setActiveAccordion}
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
                                <button onClick={() => { setShowTerms(false); }} style={{border:'1px solid #d1d5db',background:'#fff',color:'#374151',padding:'8px 14px',borderRadius:8,cursor:'pointer'}}>Choose Different Voucher</button>
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
                                }} style={{background:'#10b981',color:'#fff',padding:'8px 14px',borderRadius:8,cursor:'pointer',border:'none'}} disabled={termsLoading}>Agree and Proceed</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Voucher Type Selection */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    gap: '20px', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    minHeight: '400px'
                }}>
                    {(() => {
                        if (privateCharterVoucherTypesLoading || allVoucherTypesLoading || activityDataLoading) {
                            return (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                                    <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Loading Voucher Types...</h3>
                                    <p style={{ color: '#9ca3af' }}>Please wait while we fetch available options and pricing</p>
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
                                        {activeVouchers.length > 1 && (
                                            <>
                                                {/* Left Arrow */}
                                                <div style={{
                                                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 44, height: 44,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: canScrollVouchersLeft ? 'pointer' : 'default',
                                                    opacity: canScrollVouchersLeft ? 1 : 0.4,
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none'
                                                }} onClick={() => { if (canScrollVouchersLeft) handlePrevVoucher(); }}>
                                                    <span style={{ fontSize: 26, color: '#fff', margin: 0, lineHeight: 1 }}>‹</span>
                                                </div>
                                                {/* Right Arrow */}
                                                {canScrollVouchersRight && (
                                                    <div style={{
                                                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                        background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 44, height: 44,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none'
                                                    }} onClick={handleNextVoucher}>
                                                        <span style={{ fontSize: 26, color: '#fff', margin: 0, lineHeight: 1 }}>›</span>
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
                                            alignItems: 'center',
                                            width: '100%',
                                            overflowX: 'auto',
                                            paddingBottom: '10px',
                                            scrollBehavior: 'smooth',
                                            scrollSnapType: 'x mandatory',
                                            scrollPadding: '0 8px',
                                            WebkitOverflowScrolling: 'touch',
                                            overscrollBehavior: 'contain'
                                        }}>
                                            {activeVouchers.map((voucher, index) => (
                                                <div key={voucher.id || index} style={{
                                                    minWidth: '100%',
                                                    maxWidth: '100%',
                                                    flexShrink: 0,
                                                    scrollSnapAlign: 'start'
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
                                                    <span style={{ fontSize: 18, color: '#666', marginLeft: 2 }}>‹</span>
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
                                                    <span style={{ fontSize: 18, color: '#666', marginRight: 2 }}>›</span>
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
                                        alignItems: 'center',
                                        width: '100%',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        paddingBottom: isMobile ? '10px' : '0',
                                        scrollBehavior: 'smooth',
                                        scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                        scrollPadding: isMobile ? '0 8px' : '0',
                                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                                        overscrollBehavior: isMobile ? 'contain' : 'auto'
                                    }}>
                                        {vouchersToShow.map((voucher, index) => (
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
                                                    <ArrowBackIosIcon style={{ fontSize: 20, color: '#666', marginLeft: 5 }} />
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
                                                }} onClick={() => setCurrentViewIndex(Math.min(currentViewIndex + 1, Math.ceil(filteredVouchers.length / sfPageSize) - 1))}>
                                                    <ArrowForwardIosIcon style={{ fontSize: 20, color: '#666' }} />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Navigation Arrows - Mobile (mirror Experience) */}
                                    {(isMobile && filteredVouchers.length > 1) && (
                                        <>
                                            {/* Left Arrow (mobile) - hide on first card */}
                                            {canScrollVouchersLeft && (
                                                <div style={{
                                                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                    background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 44, height: 44,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none'
                                                }} onClick={handlePrevVoucher}>
                                                    <span style={{ fontSize: 26, color: '#fff', margin: 0, lineHeight: 1 }}>‹</span>
                                                </div>
                                            )}
                                            {/* Right Arrow (mobile) - hide on last card */}
                                            <div style={{
                                                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                                                background: 'rgb(3, 169, 244)', borderRadius: '50%', width: 44, height: 44,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: canScrollVouchersRight ? 'pointer' : 'default',
                                                opacity: canScrollVouchersRight ? 1 : 0.4,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: 'none'
                                            }} onClick={() => { if (canScrollVouchersRight) handleNextVoucher(); }}>
                                                <span style={{ fontSize: 26, color: '#fff', margin: 0, lineHeight: 1 }}>›</span>
                                            </div>
                                        </>
                                    )}

                                    {/* Voucher Cards */}
                                    <div ref={isMobile ? voucherContainerRef : undefined} className="voucher-cards-container" style={{ 
                                        display: 'flex', 
                                        flexDirection: isMobile ? 'row' : 'row', 
                                        gap: isMobile ? '16px' : '20px', 
                                        justifyContent: isMobile ? 'flex-start' : 'center',
                                        alignItems: 'center',
                                        width: '100%',
                                        overflowX: isMobile ? 'auto' : 'visible',
                                        paddingBottom: isMobile ? '10px' : '0',
                                        scrollBehavior: 'smooth',
                                        scrollSnapType: isMobile ? 'x mandatory' : 'none',
                                        scrollPadding: isMobile ? '0 8px' : '0',
                                        WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
                                        overscrollBehavior: isMobile ? 'contain' : 'auto'
                                    }}>
                                        {vouchersToShow.map((voucher, index) => (
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
                                        ))}
                                    </div>

                                </>
                            );
                        }
                    })()}
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